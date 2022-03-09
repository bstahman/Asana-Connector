const asana = require('asana');
const fs = require("fs");
const request = require("request-promise-native");

AMBI_TOKEN = process.env.AMBI_TOKEN;

const client = asana.Client.create({
	defaultHeaders: { 'Asana-Disable': 'new_user_task_lists' }})
	.useAccessToken(AMBI_TOKEN);

client.headers={'asana-disable': 'string_ids'};

const purchasingProjectID = '1201392121642374';
const testProjectID = '1201882405835962';
const sheetsFuncs = require('./googleSheetsFunctions');
const driveFuncs = require('./googleDriveFunctions');
const asanaFuncs = require('./asanaFunctions');
const dataStorage = require('./dataStorage');

async function addExistingPOsToDB() {

	orders = await asanaFuncs.getOrdersInfo();

	PONumsToAdd = [];

	for (let [key,order] of orders) {

		if(!["Created", "Processing", "PO Created"].includes(order.get('PO Status'))) {

			PONumsToAdd.push(order.get('PO Number'));
		}
	}

	for (var num of PONumsToAdd) {

		dataStorage.appendPONum(num);
	}
}

async function addOrderTaskToSpreadsheet(taskId) {

	var order = await asanaFuncs.getOrderDataFromTask(taskId);
						
	if (!dataStorage.PONumInDb(order.get('PO Number'))) {
		
		var docInfo = await asanaFuncs.getSignedDocInfoFromTask(taskId);

		var awsLink = docInfo[1];
		var docName = docInfo[0];

		if (awsLink) {

			await downloadPDF(awsLink, docName);

			folderName = "PO " + order.get('PO Number') + " " + order.get('Supplier');

			driveLink = await driveFuncs.addSignedPODocToDrive(docName, folderName, docName);

			order.set("Drive Link", driveLink);

		}

		sheetsFuncs.appendOrdersToSpreadsheet([order]);

		dataStorage.appendPONum(order.get('PO Number'));
	}	

}

function asanaEventHandler() {

	var acceptableStatuses = ['PO Created','Waiting on Supplier','Order Confirmed','In Transit','Received','Void'];

	client.events.stream(purchasingProjectID, {
	    periodSeconds: 60
	})
	    .on('data', async function (event) {

	    	try {

		    	if (event.action == 'changed' &&
		    		event.change.new_value &&
		    		event.change.new_value.name == 'PO Status' &&
		    		acceptableStatuses.includes(event.change.new_value.display_value)) {

					var order = await asanaFuncs.getOrderDataFromTask(event.resource.gid);
					
					if (!dataStorage.PONumInDb(order.get('PO Number'))) {

						// give Linda time to make additional changes (3 mins)
						await sleep(18000);

						var docInfo = await asanaFuncs.getSignedDocInfoFromTask(event.resource.gid);

						var awsLink = docInfo[1];
						var docName = docInfo[0];

						if (awsLink) {

							await downloadPDF(awsLink, docName);

							folderName = "PO " + order.get('PO Number') + " " + order.get('Supplier');

							driveLink = await driveFuncs.addSignedPODocToDrive(docName, folderName, docName);

							order.set("Drive Link", driveLink);

							fs.unlink(docName);
						}

						sheetsFuncs.appendOrdersToSpreadsheet([order]);

						dataStorage.appendPONum(order.get('PO Number'));
					}	
		    	}
	    	} 
	    	catch (error) {

	    		console.log(error);
	    	}
	    });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


async function downloadPDF(pdfURL, outputFilename) {

    let pdfBuffer = await request.get({uri: pdfURL, encoding: null});

    fs.writeFileSync(outputFilename, pdfBuffer);
}

asanaEventHandler();