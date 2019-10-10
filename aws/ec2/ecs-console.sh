#!/bin/bash

CLUSTER=$1
SERVICE=$2
PROFILE=$3
ECS_PEM_FILE=$4

if [ -z "$CLUSTER" -o -z "$SERVICE" ]; then
  echo "Usage:"
  echo "ecs-console cluster-name service-name profile pem_file"
  exit 1
fi

TASK_ID=$( aws ecs list-tasks --cluster=$CLUSTER --service-name=$SERVICE --output json --profile=$PROFILE| jq -r '.taskArns[0]' )
echo Connecting to: $TASK_ID
CONTAINER_INSTANCE_ID=$( aws ecs describe-tasks --cluster=$CLUSTER --tasks $TASK_ID --output json --profile=$PROFILE | jq -r '.tasks[0].containerInstanceArn' )
echo Connecting to: $CONTAINER_INSTANCE_ID
EC2_INSTANCE=$( aws ecs describe-container-instances --cluster=$CLUSTER --container-instances $CONTAINER_INSTANCE_ID --output json --profile=$PROFILE | jq -r '.containerInstances[0].ec2InstanceId' )
echo Connecting to: $EC2_INSTANCE
EC2_IP=$( aws ec2 describe-instances --instance-ids $EC2_INSTANCE --output json --profile=$PROFILE | jq -r '.Reservations[0].Instances[0].PrivateIpAddress' )
echo Connecting to: $EC2_IP
ssh -i $ECS_PEM_FILE core@$EC2_IP
#ssh -i $ECS_PEM_FILE core@$EC2_IP -t 'bash -c "docker exec -it $( docker ps -a -q -f name=dd-agent | head -n 1 ) bash"'

#unassh -i $ECS_PEM_FILE core@$EC2_IP -t 'bash -c "docker exec -it datadog-agent agent flare 246844"'

# COMMAND TO SEND THE FLARE, THIS COMMAND NEED TO BE EXECUTE AFTER LOGGED INTO THE INSTANCE
# docker exec -it dd-agent /etc/init.d/datadog-agent flare 246844
