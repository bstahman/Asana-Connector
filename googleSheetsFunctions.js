const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');

let keyData = JSON.parse(fs.readFileSync('keys.json'));
const clientEmail = keyData.client_email;
const privateKey = keyData.private_key;

const sheetID = '1RPBcetVCyO5J9I63Pol6BZTQm25LRYhs3xjSwYiucFc';

const doc = new GoogleSpreadsheet(sheetID);

// orders is list
async function appendOrdersToSpreadsheet(orders) {

	await doc.useServiceAccountAuth({
	  client_email: clientEmail,
	  private_key: privateKey
	});
	await doc.loadInfo();
	
	// get purchase orders spreadsheet
	const sheet = doc.sheetsByIndex[1];
	sheet.loadHeaderRow(3);

	rowList = [];
	vendorsArr = await getVendors();
	manufacturersArr = await getManufacturers();

	for (let order of orders) {

		row = new Object();

		row['PO Number'] = order.get('PO Number');
		row['Requestor'] = order.get('Requester');
		row['Categorization'] = order.get('PO Type');
		row['Destination'] = order.get('Destination');
		row['PO Date'] = order.get('PO Date');
		row['Description'] = order.get('Description');

		if (order.get("Drive Link")) {
			row['Documents'] = order.get("Drive Link");
		}

		if (vendorsArr.includes(order.get('Supplier'))) {

			row['Vendor'] = order.get('Supplier');
		}
		else if (manufacturersArr.includes(order.get('Supplier'))){

			row['Manufacturer'] = order.get('Supplier');
		}

		rowList.push(row);
	}
	console.log(rowList[0]);
	const moreRows = await sheet.addRows(rowList);
}

async function getVendors() {

	await doc.useServiceAccountAuth({
		client_email: clientEmail,
		private_key: privateKey
	});

	await doc.loadInfo();

	// get purchase orders spreadsheet
	const sheet = doc.sheetsByIndex[6];

	const rows = await sheet.getRows();

	vendorsArr = [];

	for(let row of rows) {
		vendorsArr.push(row['Vendor Name']);
	}

	return vendorsArr;
}

async function getManufacturers() {

	await doc.useServiceAccountAuth({

		client_email: clientEmail,
		private_key: privateKey
	});
	await doc.loadInfo();

	// get purchase orders spreadsheet
	const sheet = doc.sheetsByIndex[7];

	const rows = await sheet.getRows();

	manufacturersArr = [];

	for(let row of rows) {
		manufacturersArr.push(row['Manufacturers']);
	}

	return Promise.resolve(manufacturersArr);
}

module.exports = { appendOrdersToSpreadsheet, getVendors, getManufacturers };
