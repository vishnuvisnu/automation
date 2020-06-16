const AWS = require("aws-sdk");
const ecs = new AWS.ECS();
const servicediscovery = new AWS.ServiceDiscovery();
const randomstring = require("randomstring");

function syncEcsServiceWithCloudMapService(clusterName, serviceName, cloudMapServiceId) {
    var params = {
        serviceName: serviceName,
        cluster: clusterName
      };

    ecs.listTasks(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
        }
        else {
            syncTasksWithCloudMapService(data, clusterName, cloudMapServiceId);
        }
    });
}

function syncTasksWithCloudMapService(listTasksResponse, clusterName, cloudMapServiceId) {
    const describeTasksRequest = {
        cluster: clusterName,
        tasks: listTasksResponse['taskArns']
    }
    ecs.describeTasks(describeTasksRequest, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            syncIpAddrsWithCloudMapService(data['tasks'], cloudMapServiceId);
        }
    });
}

function syncIpAddrsWithCloudMapService(tasks, cloudMapServiceId) {

    const ecsServiceIpAddrs = []
    tasks.forEach(taskDetails => {
        let attachments = taskDetails['attachments'][0]['details'];
        for (let index in attachments) {
            let attachment = attachments[index];

            if (attachment['name'] == "privateIPv4Address") {
                // console.log(attachment['value']);
                ecsServiceIpAddrs.push(attachment['value']);
            }
        }
    });

    getCloudMapInstances(cloudMapServiceId, ecsServiceIpAddrs);
}

function getCloudMapInstances(cloudMapServiceId, ecsServiceIpAddrs) {
    var params = {
        Id: cloudMapServiceId
    };
    servicediscovery.getService(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            const serviceName = data['Service']['Name'];
            const namespaceId = data['Service']['NamespaceId'];

            var params = {
                Id: namespaceId
            };
            servicediscovery.getNamespace(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else {
                    const namespace = data['Namespace']['Name'];
                    var params = {
                        HealthStatus: "ALL", 
                        MaxResults: 10, 
                        NamespaceName: namespace, 
                        ServiceName: serviceName
                       };
                
                    servicediscovery.discoverInstances(params, function(err, data) {
                        if (err) console.log(err, err.stack);
                        else {
                            // console.log(JSON.stringify(data['Instances'][0]['Attributes']));
                            compareIpsWithCloudMapInstances(ecsServiceIpAddrs, data['Instances'], cloudMapServiceId);
                        }
                    });
                }
            });
        }
    });
}

function compareIpsWithCloudMapInstances(ecsServiceIpAddrs, cloudMapInstances, cloudMapServiceId) {
    const cloudMapIpAddrs = []
    const cloudMapPort = cloudMapInstances[0]['Attributes']['AWS_INSTANCE_PORT'];
    cloudMapInstances.forEach(instance => {
        const instanceIpAddr = instance['Attributes']['AWS_INSTANCE_IPV4'];
        cloudMapIpAddrs.push(instanceIpAddr);
        if (!ecsServiceIpAddrs.includes(instanceIpAddr)) {
            deregisterCloudMapInstance(cloudMapServiceId, instance['InstanceId']);
        }
    });

    ecsServiceIpAddrs.forEach(ecsServiceIpAddr => {
        if (!cloudMapIpAddrs.includes(ecsServiceIpAddr)) {
            registerCloudMapInstance(cloudMapServiceId, ecsServiceIpAddr, cloudMapPort);
        }
    })
}

function registerCloudMapInstance(cloudMapServiceId, ecsServiceIpAddr, cloudMapPort) {
    var params = {
        Attributes: {
          'AWS_INSTANCE_IPV4': ecsServiceIpAddr,
          'AWS_INSTANCE_PORT': cloudMapPort
        },
        InstanceId: `instance-${randomstring.generate(7)}`, /* required */
        ServiceId: cloudMapServiceId, /* required */
        CreatorRequestId: randomstring.generate(64)
      };
      servicediscovery.registerInstance(params, function(err, data) {
        if (err) {
            console.log("fAiLuRe, registerCloudMapInstance");
            console.log(err, err.stack); // an error occurred
        }
        else     console.log(data);           // successful response
      });
}

function deregisterCloudMapInstance(cloudMapServiceId, instanceId) {
    var params = {
        InstanceId: instanceId, 
        ServiceId: cloudMapServiceId
       };
       servicediscovery.deregisterInstance(params, function(err, data) {
         if (err){
             console.log("fAiLuRe, deregisterCloudMapInstance");
             console.log(err, err.stack); // an error occurred
         }
         else     console.log(data);           // successful response
       });
}

// syncEcsServiceWithCloudMapService('ozark', 'backend-web', 'srv-2vr3ghvtessckp46');
// syncEcsServiceWithCloudMapService('ozark', 'backend-api', 'srv-hmx4uyaiekmedc7s');
// syncEcsServiceWithCloudMapService('ozark', 'backend-internalapi', 'srv-bxn73bdexr5jrm63');


