const asana = require('asana');

AMBI_TOKEN = process.env.AMBI_TOKEN;

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

	var customFieldNames = ["PO Number",
							"Supplier",
							"Requester",
							"PO Type",
							"Destination",
							"PO Status",
							"PO Date"];

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

		field = getCustomFieldByName(result, customFieldName).display_value;

		// grabs first name only
		if (customFieldName == "Requester") {
			field = field.split(" ")[0];
		}

		return field;
    });
}

// customfieldnames is an arr
// returns map of {customFieldName => displayValue} (plus the description)
function getDisplayVals(taskId, customFieldNames) {

	var displayVals = new Map();

	return client.tasks.getTask(taskId)
	.then((result) => {

		for(var customFieldName of customFieldNames) {

			field = getCustomFieldByName(result, customFieldName).display_value;

			if(customFieldName == "Supplier") {
				if(["DWF", "DW Fritz"].includes(field)) {

					field = "DW Fritz Automation";
				}

				if(field.includes("Yaskawa")) {

					field = 'Yaskawa';
				}
			}

			// grabs first name only
			if (customFieldName == "Requester") {

				field = field.split(" ")[0];
			}

			displayVals.set(customFieldName, field);
		}

		displayVals.set('Description',getDescriptionFromNotes(result.notes));

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

async function getSignedPODocLinkFromTask(taskID) {

	signedDocID = await client.attachments.getAttachmentsForTask(taskID)
	    .then((result) => {

	    	signedDocID = null;

	        for (var attachment of result.data) {

		    	if(attachment.name.includes("signed")) {

		    		signedDocID = attachment.gid;
		    	}
    		}
    		return signedDocID;
	    });

    if (!signedDocID) {

    	return false;
    }

    docLink = await client.attachments.getAttachment(signedDocID)
	    .then((result) => {
	        
	    	return result.download_url;
	    });

	return docLink ? docLink : false;
}

// returns [name, link]
async function getSignedDocInfoFromTask(taskID) {

	var signedDocInfo = await client.attachments.getAttachmentsForTask(taskID)
	    .then((result) => {

	    	signedDocID = null;
	    	signedDocName = null;

	        for (var attachment of result.data) {

		    	if(attachment.name.includes("signed")) {

		    		signedDocID = attachment.gid;
		    		signedDocName = attachment.name
		    	}
    		}
    		return [signedDocID,signedDocName];
	    });

	var signedDocID = signedDocInfo[0];
	var signedDocName = signedDocInfo[1];

    if (!signedDocID) {

    	return false;
    }

    docLink = await client.attachments.getAttachment(signedDocID)
	    .then((result) => {
	        
	    	return result.download_url;
	    });

	return docLink ? [signedDocName,docLink] : false;
}

function getDescriptionFromNotes(string) {

	var descriptionStartIndex = 0;
	var descriptionEndIndex = 0;
	var i = 0;
	var len = string.length;

	while(i < len-12 && string.substring(i,i+12) != "Description:")
	{
		i++;
	}

	if (i == len-1) {
		return '';
	}

	i+=12;
	
	descriptionStartIndex = i;

	while(i < len-1 && string.substring(i,i+1) != "—") {
		i++;
	}

	descriptionEndIndex = i;

	return string.substring(descriptionStartIndex,descriptionEndIndex).trim();

}

module.exports = { getOrdersInfo, getOrderDataFromTask, getProjectTaskIds, getOrderDataFromTasks, getSignedDocInfoFromTask };