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
app.disable('x-powered-by');

app.get('/', (req, res) => {
	res.render('index', {
		text: ""
	});
});

app.get('/:id', (req, res) => {
	let id = req.params.id;

	db.get(id)
		.then((value) => {
			value = Buffer.from(value).toString();
			let description = value.substring(50, 0)
			description += (description.length >= 50) ? "..." : "";
			res.render('index', {
				text: value,
				description
			});
		})
		.catch(err => {
			if (err && err.type === "NotFoundError") {
				res.render('error', {
					code: 404,
					msg: "P not found"
				});
			}
		});
});

app.get('/r(aw)?/:id', (req, res) => {
	let id = req.params.id;
	res.set('Content-Type', 'text/plain');

	db.get(id)
		.then(value => {
			res.send(value);
		})
		.catch(err => {
			if (err && err.type === "NotFoundError") {
				res.status(404);
				res.send('404');
			}
		});
});

app.post('/', (req, res) => {
	let text = req.body.text;
	if (text == "" || !text) {
		return res.redirect(req.header('Referer') || '/');
	}
	generateID()
		.then(async (id) => {
			await db.put(id, text);
			res.redirect(`/${id}`);
		});
});

async function generateID() {
	let id = randomstring.generate({
		readable: true,
		capitalization: 'lowercase',
		charset: 'alphabetic',
		length: 12
	});

	return db.get(id)
		.catch(err => {
			if (err && err.type === "NotFoundError") {
				return id;
			} else {
				return generateID(callback);
			}
		});
}

app.listen(3000);