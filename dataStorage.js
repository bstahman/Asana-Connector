var fs = require("fs");

const POTextFile = 'Handled_POs.txt';

async function appendPONum(string) {

	if (!fs.existsSync(POTextFile)) {

		fs.writeFileSync(POTextFile, string, err => {console.log(err);});
	}
	else if (!PONumInDb(string)) {

		fs.writeFileSync(POTextFile, ',' + string, { flag: 'a+' }, err => {console.log(err);});
	}
}

function getPONums() {
	
	try {

		const data = fs.readFileSync(POTextFile, 'utf8');
	  
		return data.split(',');
	} 
	catch (err) {

		console.error(err);
	}
};

function PONumInDb(string) {

	return getPONums().includes(string);
}

module.exports = { appendPONum, getPONums, PONumInDb };