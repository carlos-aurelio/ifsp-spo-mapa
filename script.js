
var map;
var cbloco;

var salas_aliases = [];

var working_offline = false;

function fetch_force(url) {
	var suffix = '';
	if (!working_offline)
		suffix = '?' + Math.random();

	return fetch(url);
}

function el(id) {
	return document.getElementById(id);
}

function get_children_with_label(root, label_regex) {
	var ret = [];
	for (var i = 0; i < root.children.length; i++) {
		var label = root.children[i].getAttribute("inkscape:label");
		if (label !== null && label_regex.test(label))
			ret.push(root.children[i]);
	}
	return ret;
}

function get_real_bb(el) {
	var scale = 1.0;
	var transform = el.getAttribute("transform");
	if (transform !== null) {
		var m = transform.match(/^scale\((.*)\)$/);
		if (m !== null && m.length > 0) {
			scale = parseFloat(m[1]);
		}
	}
	var bb = el.getBBox();
	var ret = {
		x: bb.x * scale,
		y: bb.y * scale,
		width: bb.width * scale,
		height: bb.height * scale,
		};
	return ret;
}

function add_text_next_to_svg_el(el, text) {
	if (text === null) {
		el.style.setProperty("display", "none");
	} else {
		var names = text.split("/");
		var theight = 1.7;
		var tot_height = theight * (names.length - 1);
		var off_start = -tot_height / 2;
		for (var i = 0; i < names.length; i++) {
			var ret = document.createElementNS("http://www.w3.org/2000/svg", "text");
			var bbox = get_real_bb(el);
			ret.setAttributeNS(null, "x", bbox.x + (bbox.width / 2));
			ret.setAttributeNS(null, "y", off_start + bbox.y + (bbox.height / 2));
			ret.setAttributeNS(null, "font-size", "0.4mm");
			ret.setAttributeNS(null, "font-family", "monospace");
			ret.innerHTML = names[i].toUpperCase();
			el.parentElement.insertBefore(ret, el.nextSibling);
			off_start += theight;
		}
	}
}

function get_andares() {
	return get_children_with_label(map, /^andar-/);
}

function get_blocos(andar) {
	return get_children_with_label(andar, /^bloco-/);
}

function get_andar(n) {
	var arr = get_children_with_label(map, new RegExp("^andar-" + n + "$"));
	if (arr.length > 0)
		return arr[0];
	else
		return null;
}

function get_bloco(andar, bl) {
	var arr = get_children_with_label(andar, new RegExp("^bloco-" + bl + "$"));
	if (arr.length > 0)
		return arr[0];
	else
		return null;
}

function get_els_by_group_label(bloco, regex) {
	var ret = [];
	var els = get_children_with_label(bloco, regex);
	if (els.length == 1) {
		var layer = els[0];
		var rects = layer.getElementsByTagName("rect");
		var paths = layer.getElementsByTagName("path");
		for (var i = 0; i < rects.length; i++)
			ret.push(rects[i]);
		for (var i = 0; i < paths.length; i++)
			ret.push(paths[i]);
	}
	return ret;
}

function get_salas(bloco) {
	return get_els_by_group_label(bloco, /^salas$/);
}

function get_sem_acesso(bloco) {
	return get_els_by_group_label(bloco, /^sem-acesso$/);
}

function get_legendas(bloco) {
	return get_els_by_group_label(bloco, /^legendas$/);
}

function get_escadas(bloco) {
	return get_els_by_group_label(bloco, /^escadas$/);
}

function get_limites(bloco) {
	var lim = get_children_with_label(bloco, /^limites$/);
	if (lim.length === 1) {
		return lim[0];
	} else {
		return null;
	}
}

function set_escada_fill(escada) {
	var label = escada.getAttribute("inkscape:label");
	/*
	var dir = label.split("-")[1];
	var to;
	switch (dir) {
		case "R":
			to = "right";
			break;
		case "L":
			to = "left";
			break;
		default:
			to = "top";
			break;
	}
	*/
	escada.style.setProperty("fill", "#cccccc");
	//escada.style.removeProperty("stroke");
	escada.style.setProperty("stroke-width", "0.05px");
}

function get_sala(s, parent) {
	if (parent === undefined)
		parent = map;
	var all = parent.getElementsByTagName("*")
	for (var i = 0; i < all.length; i++) {
		if (all[i].getAttribute("inkscape:label") === s)
		return all[i];
	}
	return null;
}

function zoom_bloco(andar_n, bloco_l) {
	var andar = get_andar(andar_n);
	if (andar !== null) {
		var bloco = get_bloco(andar, bloco_l);
		if (bloco !== null) {
			el("zoom-bloco").innerHTML = "";
			cbloco = bloco.cloneNode(true);
			els = cbloco.children;
			for (var i = 0; i < els.length; i++)
				els[i].style.setProperty("display", "");
			cbloco.setAttribute("class", "");
			el("zoom-bloco").appendChild(cbloco);
			var bbox = get_real_bb(cbloco);
			var s1 = (150 / bbox.width);
			var s2 = (150 / bbox.height);
			var s3 = s1 < s2 ? s1 : s2;
			cbloco.setAttribute("transform",
				" scale(" + s3 + ")" +
				" translate(" + (- bbox.x) + " " + (50 - bbox.y) + ") " +
				"");
		}
	}
}

function show_sala(sala_n) {
	list_selected_sala(sala_n)
	var sala = get_sala(sala_n);
	if (sala !== null) {
		el("nomapdiv").style.setProperty("display", "none");
		el("contentdiv").style.removeProperty("opacity");
		reset_map();
		var bloco = sala.parentElement.parentElement;
		var andar = bloco.parentElement;
		var zbloco = bloco.cloneNode(true);
		set_el_view(sala, "sala", "destacado");
		set_el_view(zbloco, "bloco", "zoom");
		el("zoom-bloco").innerHTML = "<rect x=\"0\" y=\"0\" width=\"150mm\" height=\"150mm\" style=\"fill: rgb(255, 255, 255);\"></rect>";
		el("zoom-bloco").appendChild(zbloco);
		var zsala = get_sala(sala_n, zbloco);
		set_el_view(zsala, "sala", "destacado");
		var bb = get_real_bb(zbloco);
		var cbb = get_real_bb(el("zoom-bloco"));
		var sx = cbb.width / bb.width;
		var sy = cbb.height / bb.height;
		var s = sx < sy ? sx : sy;
		s *= 0.95;
		dx = (cbb.width - bb.width * s);
		dy = (cbb.height - bb.height * s);
		zbloco.style.setProperty("transform", " translateY(" + (dy / 2) + "px) translateX(" + (dx / 2) + "px) " +
			"scale(" + s + ") translateX(-" + bb.x + "px) translateY(-" + bb.y + "px)");
		
		set_el_view(andar, "andar", "destacado");
		set_el_view(bloco, "bloco", "destacado");
		
		var bnome = zbloco.getAttribute("inkscape:label").replace("-", " ").toUpperCase();
		var anome = andar.getAttribute("inkscape:label").split(",")[1].toUpperCase();
		var sala_fname = sala_n.split(";")[0];
		var sala_oname = get_sala_old_name(sala_n.split(";")[0]);
		if (sala_oname !== null)
			sala_fname += "/" + sala_oname;
		el("nome-area").innerHTML = bnome + " - " + anome + " - " + sala_fname.toUpperCase();
	} else {
		el("nomapdiv").style.removeProperty("display");
		el("contentdiv").style.setProperty("opacity", "0%");
	}
}

function set_el_view(el, prefix, view) {
	if (el !== null)
		el.setAttribute("class", prefix + "-inicial " + prefix + "-" + view);
}

function set_andar_display(andar_n, view) {
	set_el_view(get_andar(andar_n), "andar", view);
}

function set_bloco_display(andar_n, bloco_l, view) {
	var andar = get_andar(andar_n);
	if (andar !== null)
		set_el_view(get_bloco(andar, bloco_l), "bloco", view);
}

function set_sala_display(sala_n, view) {
	set_el_view(get_sala(sala_n), "sala", view);
}

function load_map() {
	console.log("requesting map...")
	fetch("ifsp.svg").then(r => r.text()).then(
		t => {
			console.log("map loaded");
			var xml = new DOMParser().parseFromString(t, "image/svg+xml");
			el("mapdiv").innerHTML = "";
			el("mapdiv").appendChild(xml.documentElement);
			map = el("mapdiv").firstChild;
			map.setAttribute("width", "150mm");
			map.setAttribute("height", "50mm");
			map.setAttribute("viewBox", "40 90 120 150");
			map.setAttribute("class", "map3d");
			init_map();
			init_direct_search();
			el("selectdiv").style.removeProperty("display");
		});
}

function init_system() {
	if (navigator.serviceWorker) {
		var url_path = window.location.pathname.replace(/[^/]*$/, '');
		console.log("Registering serviceWorker...");
		navigator.serviceWorker.register(url_path + 'sw.js', {scope: url_path });
	} else {
		console.log("serviceWorker not available");
	}
	load_map();
}

function reset_map() {
	var andares = get_andares();
	for (var i = 0; i < andares.length; i++) {
		andares[i].setAttribute("class", "andar-inicial andar-normal");
		var blocos = get_blocos(andares[i]);
		for (var j = 0; j < blocos.length; j++) {
			blocos[j].setAttribute("class", "bloco-inicial");
			var salas = get_salas(blocos[j]);
			for (var k = 0; k < salas.length; k++) {
				salas[k].setAttribute("class", "sala-inicial");
			}
		}
	}
}

function init_map() {
	var all = map.getElementsByTagName("*");
	for (var i = 0; i < all.length; i++) {
		if (all[i].style !== undefined) {
			all[i].style.removeProperty("display");
			all[i].style.removeProperty("opacity");
			all[i].style.removeProperty("top");
			all[i].style.removeProperty("left");
			all[i].style.removeProperty("transform");
		}
	}
	get_children_with_label(map, /^hide$/)[0].style.setProperty("display", "none");

	var andares = get_andares();
	for (var i = 0; i < andares.length; i++) {
		andares[i].style.setProperty("--translation-y", (i * 2) + "mm");
		var blocos = get_blocos(andares[i]);
		for (var j = 0; j < blocos.length; j++) {
			var salas = get_salas(blocos[j]);
			for (var k = 0; k < salas.length; k++) {
				salas[k].style.setProperty("stroke", "#000000");
				salas[k].style.setProperty("fill", "#fefecc");
				var label = salas[k].getAttribute("inkscape:label");
				add_sala_alias(label);
				var new_name = null;
				if (label !== null)
					new_name = label.split(";")[0];

				var old_name = get_sala_old_name(new_name);
				var full_name = new_name;
				if (old_name !== null)
					full_name = full_name + "/" + old_name;
				add_text_next_to_svg_el(salas[k], full_name);
			}
			var legendas = get_legendas(blocos[j]);
			for (var k = 0; k < legendas.length; k++) {
				legendas[k].style.setProperty("display", "none");
			}
			var sem_acesso = get_sem_acesso(blocos[j]);
			for (var k = 0; k < sem_acesso.length; k++) {
				sem_acesso[k].style.setProperty("stroke", "#000000");
			}
			var escadas = get_escadas(blocos[j]);
			for (var k = 0; k < escadas.length; k++) {
				escadas[k].style.setProperty("stroke", "#000000");
				set_escada_fill(escadas[k]);
			}
			var lim = get_limites(blocos[j]);
			if (lim !== null)
				lim.style.setProperty("stroke", "#000000");
		}
		var lim = get_children_with_label(andares[i], /^limites$/);
		if (lim !== null && lim.length === 1) {
			lim[0].style.removeProperty("fill");
			lim[0].style.removeProperty("stroke");
			lim[0].style.removeProperty("stroke-width");
		}
		reset_map();
		el("loadingdiv").style.setProperty("display", "none");
	}
}

function add_sala_alias(label) {
	if (label === null)
		return;

	var names = label.split(";");
	if (names.length > 1)
		salas_aliases.push([ names[0], names[1].toUpperCase()]);
}

function get_sala_old_name(new_name) {
	if (new_name === null)
		return null;

	var aliases = salas_aliases;
	for (var i = 0; i < aliases.length; i++) {
		if (aliases[i][0].toUpperCase() === new_name.toUpperCase())
			return aliases[i][1];
	}
	return null;
}

function get_sala_new_name(old_name) {
	if (old_name === null)
		return null;

	var aliases = salas_aliases;
	for (var i = 0; i < aliases.length; i++) {
		if (aliases[i][1].toUpperCase() === old_name.toUpperCase())
			return aliases[i][0];
	}
	return null;
}

function search_sala() {
	var in_name = prompt("Digite uma sala para localizar no mapa");
	console.log("search: " + in_name);
	if (in_name === null)
		return;

	var nname = get_sala_new_name(in_name);
	var oname = get_sala_old_name(in_name);
	var sname = in_name;
	if (nname !== null)
		sname = nname + ";" + in_name;
	else if (oname !== null)
		sname = in_name + ";" + oname;

	var sala = get_sala(sname.toLowerCase());
	if (sala === null) {
		alert("Sala não encontrada: " + in_name);
		return
	}

	show_sala(sname.toLowerCase());
	el("divsearchback").style.removeProperty("display");
}

function list_blocos() {
	var andares = get_andares();
	var ret = Array();

	for (var i = 0; i < andares.length; i++) {
		var blocos = get_blocos(andares[i]);
		for (var j = 0; j < blocos.length; j++) {
			var blname = blocos[j].getAttribute("inkscape:label");
			if (!ret.includes(blname))
				ret.push(blname);
		}
	}
	ret.sort();
	return ret;
}

function list_salas(bloco_name) {
	var andares = get_andares();
	var ret = Array();

	for (var i = 0; i < andares.length; i++) {
		var blocos = get_blocos(andares[i]);
		for (var j = 0; j < blocos.length; j++) {
			if (bloco_name == blocos[j].getAttribute("inkscape:label")) {
				var salas = get_salas(blocos[j]);
				for (var k = 0; k < salas.length; k++) {
					var sname = salas[k].getAttribute("inkscape:label");
					if (sname !== null)
						ret.push(sname);
				}
			}
		}
	}
	ret.sort();
	return ret;
}

function fill_list_blocos() {
	el("selbloco").innerHTML = "";
	var blocos = list_blocos();
	if (blocos !== undefined) {
		for (var i = 0; i < blocos.length; i++) {
			el("selbloco").innerHTML += "<option value='" + blocos[i] + "'>"
				+ blocos[i].toUpperCase().replace('-', ' ') + "</option>";
		}
	}
}

function fill_list_salas() {
	el("selsala2").innerHTML = "";
	var salas = list_salas(el("selbloco").value);
	if (salas !== undefined) {
		for (var i = 0; i < salas.length; i++) {
			var oname = get_sala_old_name(salas[i].split(";")[0]);
			var fname = salas[i].split(";")[0].toUpperCase();
			if (oname !== null)
				fname += " / " + oname;
			el("selsala2").innerHTML += "<option value='" + salas[i] + "'>"
				+ fname + "</option>";
		}
		el("selsala2").setAttribute("style", "");
	} else {
		el("selsala2").setAttribute("style", "display: none");
	}
}

function list_selected_sala(sala_n) {
	for (var i = 0; i < el("selbloco").options.length; i++) {
		var salas = list_salas(el("selbloco").options[i].value);
		for (var j = 0; j < salas.length; j++) {
			if (salas[j] == sala_n) {
				el("selbloco").selectedIndex = i;
				fill_list_salas();
				el("selsala2").selectedIndex = j;
				return;
			}
		}
	}
}

function show_sala_direct(sala_name) {
	show_sala(sala_name);
}

function evt_selbloco_change() {
	fill_list_salas();
	evt_selsala2_change();
}

function evt_selsala2_change() {
	show_sala_direct(el("selsala2").value);
}

function init_direct_search() {
	el("selbloco").onchange = evt_selbloco_change;
	el("selsala2").onchange = evt_selsala2_change;
	fill_list_blocos();
	fill_list_salas();
	evt_selbloco_change();
}
