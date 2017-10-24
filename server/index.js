/**
 * TODO:
 * - trocar os personagens por sprites de RPG Maker
 * - criar um map maker
 * - adicionar a possibilidade de limitar quais os tipos de produto cada estante irá gerar, e quantidade
 */

var socket = require('socket.io');
console.info('Iniciando servidor na porta 2209');

var Comprador = function(conn){
	this.conn = conn;
	this.id = Comprador.LAST_ID++;
	this.cor = null;
	this.nome = null;
	this.situacao = Comprador.SITUACAO_NADA;
	this.direcao = Comprador.DIRECAO_NORTE;
	this.ultimoMovimento = 0;
	this.posicao = { x: null, y: null };
	this.vida = 500;
	this.vidaMaxima = 500;
	this.items = [];
};

Comprador.LAST_ID = 0;

Comprador.SITUACAO_NADA = 1;
Comprador.SITUACAO_MUITO_SOCADO = 2;
Comprador.SITUACAO_SOCADO = 3;
Comprador.SITUACAO_SOCANDO = 4;
Comprador.SITUACAO_CORRENDO = 5;
Comprador.SITUACAO_CORRENDO_MUITO_RAPIDO = 6;
Comprador.SITUACAO_LIMITADO_A_ANDAR = 7;

Comprador.DIRECAO_NORTE = 1;
Comprador.DIRECAO_SUL = 2;
Comprador.DIRECAO_LESTE = 3;
Comprador.DIRECAO_OESTE = 4;

var Mapa = function(quadrados) {
	var saidas = [];
	this.quadrados = [];

	var constructor = (quadrados) => {
		quadrados.forEach((vetor, y) => {
			vetor.forEach((piso, x) => {
				if (piso == 5) {
					saidas.push({ x, y });
				}

				if (!this.quadrados[y]) this.quadrados[y] = [];
				this.quadrados[y][x] = new Piso(piso);
			});
		});
	};

	this.sortearUmaSaida = () => {
		if (!saidas.length) {
			throw "Não existem posições livres para se iniciar no jogo";
		}

		return saidas[Math.floor(Math.random() * saidas.length)];
	}

	this.getItem = (pos) => {
		return this.quadrados[pos.y][pos.x];
	}

	constructor(quadrados);
}

var Item = function(args){
	this.id = Item.LAST_ID++;
	this.nome = args.nome || null;
	this.tipo = args.tipo || null;
	this.pontos = args.pontos || null;
	this.imagem = args.imagem || null;
}

Item.LAST_ID = 0;

Item.TIPO_CARNE = 1;
Item.TIPO_VEGETAL = 2;
Item.TIPO_NAO_PERECIVEL = 3;
Item.TIPO_CONDIMENTO = 4;
Item.TIPO_HIGIENICO = 5;

var mercadoriasEspecies = {
	[Item.TIPO_CARNE]: [
		{ nome: 'Frango', tipo: Item.TIPO_CARNE, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Ovos', tipo: Item.TIPO_CARNE, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Picanha', tipo: Item.TIPO_CARNE, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Queijo', tipo: Item.TIPO_CARNE, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Fígado', tipo: Item.TIPO_CARNE, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Acém', tipo: Item.TIPO_CARNE, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Salmão', tipo: Item.TIPO_CARNE, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Sardinhas', tipo: Item.TIPO_CARNE, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Leite', tipo: Item.TIPO_CARNE, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Camarão', tipo: Item.TIPO_CARNE, pontos: 15, imagem: 'carne.png' }
	],

	[Item.TIPO_VEGETAL]: [
		{ nome: 'Espinafre', tipo: Item.TIPO_VEGETAL, pontos: 15, imagem: 'abacaxi.png' },
		{ nome: 'Cenoura', tipo: Item.TIPO_VEGETAL, pontos: 15, imagem: 'abacaxi.png' },
		{ nome: 'Alface', tipo: Item.TIPO_VEGETAL, pontos: 15, imagem: 'abacaxi.png' },
		{ nome: 'Tomate', tipo: Item.TIPO_VEGETAL, pontos: 15, imagem: 'abacaxi.png' },
		{ nome: 'Sushi', tipo: Item.TIPO_VEGETAL, pontos: 15, imagem: 'abacaxi.png' },
		{ nome: 'Maça', tipo: Item.TIPO_VEGETAL, pontos: 15, imagem: 'abacaxi.png' },
		{ nome: 'Laranja', tipo: Item.TIPO_VEGETAL, pontos: 15, imagem: 'abacaxi.png' }
	],

	[Item.TIPO_NAO_PERECIVEL]: [
		{ nome: 'Cerveja', tipo: Item.TIPO_NAO_PERECIVEL, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Arroz', tipo: Item.TIPO_NAO_PERECIVEL, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Feijão', tipo: Item.TIPO_NAO_PERECIVEL, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Espaguete', tipo: Item.TIPO_NAO_PERECIVEL, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Farinha', tipo: Item.TIPO_NAO_PERECIVEL, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Sal', tipo: Item.TIPO_NAO_PERECIVEL, pontos: 15, imagem: 'carne.png' },
		{ nome: 'Açúcar', tipo: Item.TIPO_NAO_PERECIVEL, pontos: 15, imagem: 'carne.png' }
	],

	[Item.TIPO_CONDIMENTO]: [
		{ nome: 'Batatinhas', tipo: Item.TIPO_CONDIMENTO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Ketchup', tipo: Item.TIPO_CONDIMENTO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Mostarda', tipo: Item.TIPO_CONDIMENTO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Miojo', tipo: Item.TIPO_CONDIMENTO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Requeijão', tipo: Item.TIPO_CONDIMENTO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Iorgute', tipo: Item.TIPO_CONDIMENTO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Refrigerante', tipo: Item.TIPO_CONDIMENTO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Doces', tipo: Item.TIPO_CONDIMENTO, pontos: 15, imagem: 'maca.png' }
	],

	[Item.TIPO_HIGIENICO]: [
		{ nome: 'Papel higiênico', tipo: Item.TIPO_HIGIENICO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Cloro', tipo: Item.TIPO_HIGIENICO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Desinfetante', tipo: Item.TIPO_HIGIENICO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Chinelo', tipo: Item.TIPO_HIGIENICO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Pasta de dente', tipo: Item.TIPO_HIGIENICO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Detergente', tipo: Item.TIPO_HIGIENICO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Esponja de aço', tipo: Item.TIPO_HIGIENICO, pontos: 15, imagem: 'maca.png' },
		{ nome: 'Álcool', tipo: Item.TIPO_HIGIENICO, pontos: 15, imagem: 'maca.png' }
	]
};

var TipoDePiso = function(args){
	this.id = args.id;
	this.nome = args.nome;
	this.pisavel = args.pisavel;
	this.abrivel = args.abrivel;
};

var pisosPossiveis = {
	1: new TipoDePiso({ id: 1, nome: 'chão', pisavel: true, abrivel: false }),
	2: new TipoDePiso({ id: 2, nome: 'prateleira', pisavel: false, abrivel: true }),
	3: new TipoDePiso({ id: 3, nome: 'corpo morto', pisavel: true, abrivel: true }),
	4: new TipoDePiso({ id: 4, nome: 'caixa', pisavel: true, abrivel: true }),
	5: new TipoDePiso({ id: 5, nome: 'saida', pisavel: true, abrivel: false }),
	6: new TipoDePiso({ id: 6, nome: 'comprador', pisavel: true, abrivel: true })
};

var Piso = function(args){
	if (typeof args == 'number') args = { tipo: args };

	this.tipo = pisosPossiveis[args.tipo] || null;
	this.capacidade = args.capacidade || 6;
	this.conteudo = [];

	var constructor = () => {
		if (this.tipo.abrivel) {
			gerarConteudo();
		}
	};

	var gerarConteudo = () => {
		var chance = Math.random();
		var quantoItens = null;

		if (chance <= 0.3) {
			quantoItens = 0;
		} else if (chance <= 0.55) {
			quantoItens = 1;
		} else if (chance <= 0.75) {
			quantoItens = 2;
		} else if (chance <= 0.85) {
			quantoItens = 3;
		} else if (chance <= 0.95) {
			quantoItens = 4;
		} else {
			quantoItens = 5;
		}

		for (var i = 0; i < quantoItens; i++) {
			var chavesDoMapa = Object.keys(mercadoriasEspecies);
			var categoriaEscolhida = chavesDoMapa[Math.floor(Math.random() * chavesDoMapa.length)];
			var i = Math.floor(mercadoriasEspecies[categoriaEscolhida].length * Math.random());
			this.conteudo.push(new Item(
				mercadoriasEspecies[categoriaEscolhida][i]
			));
		}
	};

	constructor();
};

var mapa = new Mapa([
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
	[ 1, 1, 1, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
]);

var compradores = {};

var configs = {
	DELAY_DE_MOVIMENTO: 200
};

var atualizarPosicao = function(comprador, posicao){
	var xy = `${comprador.posicao.x}x${comprador.posicao.y}`;
	if (!compradores[xy] || compradores[xy].length <= 1) {
		delete compradores[xy];
	} else {
		var i = compradores[xy].indexOf(comprador);
		compradores[xy].splice(i, 1);
	}

	comprador.posicao = posicao;
	xy = `${comprador.posicao.x}x${comprador.posicao.y}`;
	if (!compradores[xy]) compradores[xy] = [];

	compradores[xy].push(comprador);
	server.emit('atualizar posição', {
		id: comprador.id,
		posicao: comprador.posicao
	});
};

var getCompradores = function(){
	var lista = [];
	Object.keys(compradores).forEach((xy) => {
		compradores[xy].forEach((outroComprador) => {
			lista.push({
				id: outroComprador.id,
				posicao: outroComprador.posicao,
				cor: outroComprador.cor,
				nome: outroComprador.nome
			});
		});
	});

	return lista;
};

var server = socket(2209);
server.on('connection', (conn) => {
	console.info('Nova conexão detectada.');

	var comprador = new Comprador(conn);
	conn.emit('abrir jogo', {
		mapa,
		compradores: getCompradores()
	});
	conn.on('quem sou eu', (cadastro) => {
		if (!cadastro.nome) {
			conn.emit('erro', {
				msg: 'O campo nome é obrigatório'
			});
			return;
		}

		if (!cadastro.cor) {
			conn.emit('erro', {
				msg: 'O campo cor é obrigatório'
			});
			return;
		}

		comprador.nome = cadastro.nome;
		comprador.cor = cadastro.cor;
		conn.emit('este é você', {
			id: comprador.id,
			nome: comprador.nome
		});

		server.emit('este é alguém', {
			id: comprador.id,
			nome: comprador.nome,
			cor: comprador.cor
		});

		console.info(`Jogador cadastrado como "${cadastro.nome}".`);

		try {
			atualizarPosicao(comprador, mapa.sortearUmaSaida());
		} catch (e) {
			conn.emit('erro', { msg: e });
		}

		conn.on('mover', (direcao) => {
			var agora = new Date().getTime();
			if (comprador.ultimoMovimento >= (agora + configs.DELAY_DE_MOVIMENTO)) {
				return;
			}

			var checkPosition = {
				x: comprador.posicao.x,
				y: comprador.posicao.y
			};

			if (Comprador.DIRECAO_NORTE == direcao) {
				checkPosition.y--;
			} else if (Comprador.DIRECAO_SUL == direcao) {
				checkPosition.y++;
			} else if (Comprador.DIRECAO_LESTE == direcao) {
				checkPosition.x++;
			} else if (Comprador.DIRECAO_OESTE == direcao) {
				checkPosition.x--;
			}

			if (jogo.getItem(checkPosition).tipo.pisavel) {
				atualizarPosicao(comprador, checkPosition);
			}
		});

		conn.on('socar', () => {

		});

		conn.on('correr', () => {

		});
	});

	conn.on('disconnect', () => {
		var xy = `${comprador.posicao.x}x${comprador.posicao.y}`;
		if (comprador[xy]) {
			comprador[xy].splice(comprador[xy].indexOf(comprador), 1);
			if (!comprador[xy].length) {
				delete comprador[xy];
			}
		}
		server.emit('morreu', { id: comprador.id });
		console.info('Jogador desconectou.');
	});
});

console.info('Servidor iniciado');