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

var voce = {

};

var criarAlguem = function(alguem){
	console.info(alguem);
	var $comprador = $(`<div
		class="comprador"
		id="comprador-${alguem.id}"
		style="background-color: ${alguem.cor}"
	>
	<span>${alguem.nome}</span>
	</div>`);

	if (alguem.posicao) {
		$comprador.css({
			left: alguem.posicao.x * 32,
			top: alguem.posicao.y * 32
		});
	}

	$comprador.appendTo("#map-wrapper");
};

window.onconnect = () => {
	var conn = io.connect(`http://${config.server}:${config.port}`);
	console.info('Servidor conectado.');
	conn.on('abrir jogo', (jogo) => {
		console.info(jogo);
		var mapa = jogo.mapa;

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

		jogo.compradores.forEach(criarAlguem);

		conn.on('este é alguém', criarAlguem);
		conn.on('atualizar posição', alguem => {
			if (voce.id == alguem.id) {
				voce.posicao = alguem.posicao;

				$("#map-wrapper").css({
					left: voce.posicao.x * -32 + (460 / 2),
					top: voce.posicao.y * -32 + (640 / 2)
				});
			}

			$(`#comprador-${alguem.id}`).css({
				left: alguem.posicao.x * 32,
				top: alguem.posicao.y * 32
			});
		});
	});

	conn.on('este é você', (eu) => {
		voce.id = eu.id;
		$("#player-nome").text(eu.nome);
	});

	conn.on('morreu', (alguem) => {
		$(`#comprador-${alguem.id}`).remove();
	});

	conn.on('erro', (erro) => {
		alertify.error(erro.msg);
	});

	conn.on('disconnect', () => {
		alertify.error('Você perdeu a conexão');
		$("#map-wrapper").children().remove();
	});
};