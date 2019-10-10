# aws autoscaling update-auto-scaling-group --auto-scaling-group-name eks --min-size 0 --max-size 0 --desired-capacity 0 --profile acorns-production

aws autoscaling delete-auto-scaling-group --auto-scaling-group-name eks --profile acorns-production>&2
