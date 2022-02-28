const asana = require('asana');
require('dotenv').config();
console.log(process.env);


AMBI_TOKEN = process.env.AMBI_TOKEN;
TEST_TOKEN = process.env.TEST_TOKEN;


const client = asana.Client.create({
	defaultHeaders: { 'Asana-Disable': 'new_user_task_lists' }})
	.useAccessToken(AMBI_TOKEN);

client.headers={'asana-disable': 'string_ids'};

const purchasingProjectID = '1201392121642374';
const testProjectID = '1201882405835962';
const sheetsFuncs = require('./googleSheetsFunctions');
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

	response = await sheetsFuncs.appendOrdersToSpreadsheet([await asanaFuncs.getOrderDataFromTask(taskId)]);
}

async function addOrderTasksToSpreadsheet() {

	taskIds = await asanaFuncs.getProjectTaskIds(purchasingProjectID);

	orders = await asanaFuncs.getOrderDataFromTasks(taskIds);

	response = await sheetsFuncs.appendOrdersToSpreadsheet(orders);
}

function asanaEventHandler() {

	var acceptableStatuses = ['Waiting on Supplier','Order Confirmed','In Transit','Received','Void'];

	client.events.stream(purchasingProjectID, {
	    periodSeconds: 5
	})
	    .on('data', async function (event) {

	    	try {

		    	if (event.action == 'changed' &&
		    		event.change.new_value &&
		    		event.change.new_value.name == 'PO Status' &&
		    		acceptableStatuses.includes(event.change.new_value.display_value)) {

					var order = await asanaFuncs.getOrderDataFromTask(event.resource.gid);
					
					if (!dataStorage.PONumInDb(order.get('PO Number'))) {

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

asanaEventHandler();