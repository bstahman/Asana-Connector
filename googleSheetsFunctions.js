const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');

let keyData = JSON.parse(fs.readFileSync('keys.json'));
const clientEmail = keyData.client_email;
const privateKey = keyData.private_key;

const sheetID = '1UkIITVF3kBwXbTHO5bp8VVgv5Jk172yrorOQSZwBPbE';

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

		if (!["Created", "Processing", "PO Created"].includes(order.get('PO Status'))) {

			row = new Object();

			row['PO Number'] = order.get('PO Number');
			row['Requestor'] = order.get('Requester');
			row['Categorization'] = order.get('PO Type');
			row['Destination'] = order.get('Destination');

			if (vendorsArr.includes(order.get('Supplier'))) {

				row['Vendor'] = order.get('Supplier');
			}
			else if (manufacturersArr.includes(order.get('Supplier'))){

				row['Manufacturer'] = order.get('Supplier');
			}

			rowList.push(row);
		}
	}
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
