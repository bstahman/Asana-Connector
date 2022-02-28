const asana = require('asana');
require('dotenv').config();

AMBI_TOKEN = process.env.AMBI_TOKEN;
TEST_TOKEN = process.env.TEST_TOKEN;

const client = asana.Client.create({
	defaultHeaders: { 'Asana-Disable': 'new_user_task_lists' }})
	.useAccessToken(AMBI_TOKEN);

client.headers={'asana-disable': 'string_ids'};

const purchasingProjectID = '1201392121642374';

async function getOrdersInfo() {

	return getProjectTaskIds(purchasingProjectID)
	.then(async function(taskIds) {

		var orders = new Map();

		var orderData = await Promise.resolve(getOrderDataFromTasks(taskIds));

		taskIds.forEach(function (taskId, index) {
			orders.set(taskId, orderData[index]);
		});

		return orders;
	});
}

function getOrderDataFromTasks(taskIds) {

	var ordersArr = [];

	for (var id of taskIds) {

		ordersArr.push(getOrderDataFromTask(id));
	}
	return Promise.all(ordersArr);
}

function getProjectTaskIds(projectId) {

	var taskIds = [];

	return client.tasks.getTasks({project: projectId})
    .then((result) => {

        for(var i = 0; i < result.data.length; i++) {

        	taskIds.push(result.data[i].gid);
        }
        return taskIds;
    });
}

// returns map of a single PO's data given a task id 
async function getOrderDataFromTask(taskId) {

	var customFieldNames = ["PO Number","Supplier","Requester","PO Type","Destination","PO Status"];

	order = await Promise.resolve(getDisplayVals(taskId, customFieldNames));

	return order;
}

function getCustomFieldValsForTasks(taskIds, customFieldName) {

	for (var id of taskIds) {
		getDisplayVal(id, customFieldName)
		.then(function(display_value) {
			console.log(display_value);
		});
	}
}

function getDisplayVal(taskId, customFieldName) {

	return client.tasks.getTask(taskId)
	.then((result) => {

		return getCustomFieldByName(result, customFieldName).display_value;
    });
}

// customfieldnames is an arr
// returns map of {customFieldName => displayValue}
function getDisplayVals(taskId, customFieldNames) {

	var displayVals = new Map();

	return client.tasks.getTask(taskId)
	.then((result) => {

		for(var customFieldName of customFieldNames) {

			displayVals.set(customFieldName, 
						getCustomFieldByName(result, customFieldName).display_value);
		}
		return displayVals;
    });
}

function getCustomFieldByName(result, customFieldName) {

    for(var i=0; i < result.custom_fields.length; i++){

        if(result.custom_fields[i].name == customFieldName){

            return result.custom_fields[i];
        }
    }
}

module.exports = { getOrdersInfo, getOrderDataFromTask, getProjectTaskIds, getOrderDataFromTasks };