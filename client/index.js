var getFileContent = (filename) => {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', filename, false);
	xhr.send();
	return xhr.responseText;
};

var getFileJson = (filename) => {
	return JSON.parse(getFileContent(filename));
};

var config;

window.onload = () => {
	console.info('Aplicação carregada, tentando conectar ao servidor...');
	config = getFileJson('config.json');

	var script = document.createElement('script');
	script.setAttribute('src', `http://${config.server}:${config.port}/socket.io/socket.io.js`);
	script.onload = window.onconnect;

	document.head.appendChild(script);
};

var inimigos = {

};

var voce = {

};
window.onconnect = () => {
	var conn = io.connect(`http://${config.server}:${config.port}`);
	console.info('Servidor conectado.');
	conn.on('abrir jogo', (mapa) => {
		console.info('Renderizando mapa.');
		var $mapWrapper = $("#map-wrapper");
		$mapWrapper.css({ width: 32 * mapa.quadrados.length });
		conn.emit('quem sou eu', { nome: 'lordazzi', cor: 'red' });

		mapa.quadrados.forEach((linha) => {
			var $linha = $("<div class='linha'>");
			linha.forEach((piso) => {
				if (piso.tipo.id == 1) {
					$linha.append($('<div class="chao">'));
				} else if (piso.tipo.id == 2) {
					$linha.append($('<div class="prateleira">'));
				} else if (piso.tipo.id == 5) {
					$linha.append($('<div class="saida">'));
				}
			});
			$mapWrapper.append($linha);
		});

		conn.on('atualizar posição', (alguem) => {
			if (alguem.id == alguem.id) {
				voce.posicao = alguem.posicao;

				$("#map-wrapper").css({
					left: voce.posicao.x * -32 + (460 / 2),
					top: voce.posicao.y * -32 + (640 / 2)
				});
			}
		});
	});

	conn.on('este é você', (eu) => {
		voce.id = eu.id;
	});

	conn.on('erro', (erro) => {
		console.error(erro.msg);
	});
};