const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const morgan = require('morgan');
const leveldown = require('leveldown');
const levelup = require('levelup');
const bodyParser = require('body-parser');
const randomstring = require("randomstring");

const app = express();
const publicDir = path.join(__dirname, 'public');
const db = levelup(leveldown('./db')); // wtf

app.engine('handlebars', exphbs({
	defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');
app.use(express.static(publicDir));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.get('/', (req, res) => {
	res.render('index', {
		text: ""
	});
});

app.get('/:id', (req, res) => {
	let id = req.params.id;

	db.get(id, (err, value) => {
		if (err && err.type === "NotFoundError") {
			return res.render('error', {
				code: 404,
				msg: "P not found"
			})
		}

		res.render('index', {
			text: value
		});
	});
});

app.get('/r/:id', (req, res) => {
	let id = req.params.id;
	res.set('Content-Type', 'text/plain');

	db.get(id, (err, value) => {
		if (err && err.type === "NotFoundError") {
			value = 404;
			res.status = 404;
		}

		res.send(value);
	});
});

app.post('/', (req, res) => {
	generateID(id => {
		db.put(id, req.body.text, (err) => {
			res.redirect(`/${id}`)
		});
	});
});

function generateID(callback) {
	let id = randomstring.generate({
		readable: true,
		capitalization: 'lowercase',
		charset: 'alphabetic',
		length: 12
	});

	return db.get(id, (err) => {
		if (err && err.type === "NotFoundError") {
			return callback(id);
		} else {
			return generateID(callback);
		}
	});
}

app.listen(3000);