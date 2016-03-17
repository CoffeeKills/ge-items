var request = require('request');
var fs = require('fs');
var cheerio = require('cheerio');
var url = 'http://services.runescape.com/m=itemdb_rs/catalogue?cat=';
var cats_pags = {};
var urls = [];
var cat_id = 0;
var items = [];
var i = 0;
var bad_data = [];
var item_data = {};

function getData(my_url, callback) {
	var output =[],last;
	request(my_url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			$ = cheerio.load(body);
			$('tr td a').each(function(e, elem) {
				if (last != elem.attribs.href)  output.push(elem.attribs.href);
				last = elem.attribs.href;
			});
			callback(null, output);
		} else {
			callback(response.statusCode || error, null);
		};
	});
};

function getPages(cat1, callback) {
	request(url + cat1, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			$ = cheerio.load(body);
			var  pages = 0;
			$('.paging ul li a').each(function(e, elem) {
				pages++;
			});
			//console.log(pages)
			callback(null, pages);
		} else {
			callback(error, null);
		};
	});
};

function getPagesLoop(t) {
	var y = t || 38;
	getPages(cat_id, function(err, pages) {
		console.log("Fetching data from catagory: " + cat_id + ' pages: ' + pages);
		cats_pags[cat_id] = pages;
		cat_id++;
		if (cat_id < y) {
			getPagesLoop(y);
		} else setUrls();
	});
};

function setUrls() {
	console.log("Settting URL's...");
	for (var key in cats_pags) {
		for (var y = 0; y <= cats_pags[key]; y++) {
			var thing = key + "&page=" + (y+1);
			urls.push(url + thing);
			console.log(thing)
		}
	};
	fs.appendFile('./urls.json', JSON.stringify(urls));
	console.log("URL's done");
	scrapeLoop();
};

function scrapeLoop() {
	var crap = "http://services.runescape.com/m=itemdb_rs/";
	if (urls.hasOwnProperty(i)) {
		console.log("Scraping... " + urls[i]);
		getData(urls[i], function(err, data) {
			for (key in data) {
				var str = data[key];
				if(str.indexOf('viewitem') === -1) {
					str = str.replace(crap,"");
					bad_data.push(str);
					console.log("bad data " + str);
				} else {
					str = str.replace(crap,"");
					str = str.replace("/viewitem?obj","");
					str = str.replace(/_/g," ");
					var res = str.split("=");
					item_data[res[0]] = res[1];
				};
			}
			if (i <= urls.length) {
				scrapeLoop();
				i++;
			}
		});
	} else {
   		fs.appendFile('./output.json', JSON.stringify(item_data));
   		fs.appendFile('./bad_data.json', JSON.stringify(bad_data));
		console.log("Finished... output.json & bad_data.json");
	};
};

function init() {
	if (fs.existsSync('./output.json')) {
		console.log('output.json already exists');
	} else {
		if (fs.existsSync('./urls.json')) {
		    urls = require('./urls.json');
		    scrapeLoop();
		} else {
			console.log("Slowly obtaining URLs...");
			getPagesLoop(38); //amount of GE catagories
		};
	};
};

console.log("Initiated");

init();