# Add new context to kube config from nee eks cluster
aws eks --region us-east-1 update-kubeconfig --name shawnee --profile acorns-production

# Use context by name
kubectl config use-context arn:aws:eks:us-east-1:255479557906:cluster/shawnee

# Apply auth config
kubectl apply -f aws-auth-cm.yaml
