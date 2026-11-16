# End-to-End Kubernetes Three-Tier DevSecOps Project

A full-stack task management application and DevSecOps delivery workflow. The project combines a React user interface, a Node.js/Express REST API, and MongoDB with Docker packaging, Jenkins CI pipelines, AWS infrastructure provisioning, and Kubernetes deployment manifests.

> **Project scope:** This repository contains application code, CI pipeline definitions, Jenkins-host provisioning Terraform, and Kubernetes manifests. It does not provision an EKS cluster or configure AWS, Jenkins, SonarQube, DNS, or ECR automatically. Those services and their credentials must be prepared separately.

## What the application does

The application, branded **Focus**, provides a personal task workspace. Users can:

- Create tasks and see them persisted in MongoDB.
- Mark tasks as complete or active, and delete them.
- Filter the list to show all, active, or completed tasks.
- View remaining-task counts and a completion percentage.
- Use a responsive interface with empty states, submission feedback, and error messages.

The backend exposes task CRUD endpoints under `/api/tasks` and health, readiness, and startup endpoints for container orchestration.

## Architecture

```text
Browser
  |
  v
React frontend (port 3000)
  |  /api/tasks
  v
Express API (port 3500)
  |
  v
MongoDB (port 27017)
```

In the Kubernetes configuration, the frontend, API, and database run as separate workloads in the `three-tier` namespace. An AWS Application Load Balancer Ingress routes `/` to the frontend and `/api` plus API health checks to the backend.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React 17, Create React App, Axios, Material UI dependency |
| Backend | Node.js, Express 4, Mongoose 6, CORS |
| Database | MongoDB |
| Containers | Docker |
| CI/CD | Jenkins Declarative Pipelines |
| Cloud infrastructure | AWS EC2, VPC, IAM, S3 Terraform state, ECR |
| Infrastructure as code | Terraform |
| Orchestration and ingress | Kubernetes, `kubectl`, AWS Load Balancer Controller / ALB |
| Pipeline security and quality tools | SonarQube, OWASP Dependency-Check, Trivy |

## Repository layout

```text
Application-Code/
  backend/                    Express API, Mongoose model, routes, Dockerfile
  frontend/                   React application, API client, Dockerfile
Jenkins-Pipeline-Code/
  Jenkinsfile-Backend         Backend build, scan, image publish, manifest update
  Jenkinsfile-Frontend        Frontend build, scan, image publish, manifest update
Jenkins-Server-TF/             Terraform for a Jenkins EC2 host and its network/IAM
Kubernetes-Manifests-file/
  Backend/                     API Deployment and Service
  Database/                    MongoDB Deployment, Service, PV, PVC, Secret manifest
  Frontend/                    Frontend Deployment and Service
  ingress.yaml                 ALB Ingress routes
```

## Run locally

### Prerequisites

- Node.js and npm. Node 14 is the version used by the Dockerfiles.
- Docker, for running MongoDB locally, or another reachable MongoDB instance.
- Git.

### 1. Start MongoDB

In PowerShell:

```powershell
docker run -d --name focus-mongodb -p 27017:27017 mongo:4.4.6
```

If a container named `focus-mongodb` already exists, start it with `docker start focus-mongodb`.

### 2. Start the backend

Open a terminal in the backend directory:

```powershell
cd Application-Code\backend
npm install
$env:MONGO_CONN_STR = "mongodb://localhost:27017/todo"
npm start
```

The API listens on `http://localhost:3500`. For this local, unauthenticated MongoDB setup, leave `USE_DB_AUTH` unset.

### 3. Start the frontend

Open a second terminal in the frontend directory:

```powershell
cd Application-Code\frontend
npm install
$env:REACT_APP_BACKEND_URL = "http://localhost:3500/api/tasks"
npm start
```

Open `http://localhost:3000`. The frontend defaults to the same local API URL if `REACT_APP_BACKEND_URL` is not set.

To stop and remove the local database container when finished:

```powershell
docker stop focus-mongodb
docker rm focus-mongodb
```

## REST API

Base URL: `http://localhost:3500`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/tasks` | List tasks |
| `POST` | `/api/tasks` | Create a task; JSON body: `{"task":"Example task"}` |
| `PUT` | `/api/tasks/:id` | Update a task, for example `{"completed":true}` |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/healthz` | Liveness check |
| `GET` | `/ready` | Readiness check; returns not-ready while MongoDB is disconnected |
| `GET` | `/started` | Startup check |

The task document contains a required `task` string and a `completed` boolean that defaults to `false`.

## DevSecOps workflow

The frontend and backend have separate Jenkins pipelines. Each pipeline is configured to:

1. Clean the Jenkins workspace and check out the source repository.
2. Run a SonarQube analysis and wait for the quality gate.
3. Run OWASP Dependency-Check and a Trivy filesystem scan.
4. Build a Docker image, authenticate to Amazon ECR, and push an image tagged with the Jenkins build number.
5. Run a Trivy scan against the pushed image.
6. Update the corresponding Kubernetes Deployment image tag and push the manifest change to Git.

The Jenkins pipeline files describe the automation; they require a configured Jenkins controller/agent, plugins, tools, credentials, AWS resources, and repository access before they can run.

### Jenkins prerequisites and configuration

The pipeline references these Jenkins credentials:

- `GITHUB` for source checkout.
- `ACCOUNT_ID`, `ECR_REPO1` (frontend), and `ECR_REPO2` (backend).
- `github` as a GitHub token used to push the updated manifest.
- A SonarQube token credential with ID `sonar-token`.

It also expects configured Jenkins tools/integrations named `jdk`, `nodejs`, `sonar-scanner`, `sonar-server`, and `DP-Check`, along with the SonarQube, Dependency-Check, Git, and Pipeline plugin functionality used in the Jenkinsfiles. The agent needs Docker, AWS CLI, Trivy, and access to the relevant AWS and GitHub resources.

The Jenkinsfiles currently point to a specific GitHub repository, use the `us-east-1` AWS region, and push manifest changes to `master`. Update these values and the ECR image names to match your own environment before using the pipelines.

## AWS and Kubernetes deployment outline

### Provision the Jenkins host

The Terraform under `Jenkins-Server-TF/` defines a VPC, public subnet, internet gateway, route table, security group, IAM role/profile, and Jenkins EC2 instance. Its user-data script attempts to install Jenkins and the DevSecOps command-line tools.

Before applying it:

1. Configure AWS credentials with permissions for the resources Terraform manages.
2. Ensure the S3 bucket configured in `backend.tf` already exists and that Terraform can access it.
3. Ensure the EC2 key pair named in `variables.tfvars` exists in `us-east-1`, or change the variable to a key pair you own.
4. Review the EC2 instance type, CIDR ranges, security-group ingress, IAM permissions, and install script.

From `Jenkins-Server-TF/`, use:

```bash
terraform init
terraform plan -var-file="variables.tfvars"
terraform apply -var-file="variables.tfvars"
```

The variables file is named `variables.tfvars`, so it must be passed explicitly. `terraform destroy -var-file="variables.tfvars"` removes the resources managed by this configuration; review the plan carefully before confirming.

### Prepare the Kubernetes environment

The manifests assume an existing Kubernetes cluster with working `kubectl` access, ECR image access, and the AWS Load Balancer Controller configured for ALB Ingress. They also assume the `three-tier` namespace and the referenced registry/database credentials exist.

Before applying the manifests:

1. Update the image references in the frontend and backend Deployments to your ECR repositories and image tags.
2. Update the Ingress hostname and frontend `REACT_APP_BACKEND_URL` for your DNS name and ALB.
3. Create the `three-tier` namespace and the `ecr-registry-secret` image pull secret.
4. Create `mongo-sec` with the MongoDB username and password using your cluster's secret-management process. Do not put real credentials in Git.
5. Configure the API's MongoDB authentication consistently with the MongoDB root credentials. The current API code only uses `MONGO_USERNAME` and `MONGO_PASSWORD` when `USE_DB_AUTH` is enabled. The checked-in API Deployment does not currently set that flag, and its MongoDB connection string does not specify `authSource=admin`; reconcile these settings before deploying with MongoDB authentication enabled.
6. Review the MongoDB storage configuration. The included PersistentVolume uses `hostPath`, which is generally suitable only for local/testing clusters and is not durable, portable cloud storage.

An example manifest application order, after configuring the prerequisites above:

```bash
kubectl apply -f Kubernetes-Manifests-file/Database/pv.yaml
kubectl apply -f Kubernetes-Manifests-file/Database/pvc.yaml
kubectl apply -f Kubernetes-Manifests-file/Database/deployment.yaml
kubectl apply -f Kubernetes-Manifests-file/Database/service.yaml
kubectl apply -f Kubernetes-Manifests-file/Backend/
kubectl apply -f Kubernetes-Manifests-file/Frontend/
kubectl apply -f Kubernetes-Manifests-file/ingress.yaml
```

Check rollout and service status with:

```bash
kubectl get pods,services,ingress -n three-tier
kubectl describe deployment api -n three-tier
kubectl logs deployment/api -n three-tier
```

## Achievements demonstrated

- Built a working three-tier application with a React client, REST API, and persistent MongoDB data model.
- Implemented task creation, completion toggling, deletion, filtering, and progress summaries.
- Added health, readiness, and startup endpoints, and wired them to Kubernetes probes.
- Containerized the application components and described Kubernetes Deployments, Services, persistence, and ingress routing.
- Defined separate CI pipelines for frontend and backend, including source-quality, dependency, filesystem, and image scanning stages.
- Automated ECR image publishing and Kubernetes manifest image-tag updates in the pipeline definitions.
- Used Terraform to describe the AWS network, IAM, and EC2 resources for a Jenkins host.

These are capabilities represented in the repository; actual cloud deployment depends on completing the environment-specific setup described above.

## Current limitations and production considerations

- The checked-in manifests and Jenkinsfiles include environment-specific AWS account/image references, repository settings, and a hostname. Replace them with values for your own environment.
- A `secrets.yaml` file is present in the database manifest directory. Do not commit real passwords or tokens; prefer creating Kubernetes Secrets outside source control or using a dedicated secret manager.
- The Terraform security group allows internet-wide ingress on management/service ports, and the attached IAM policy is `AdministratorAccess`. Restrict access and use least-privilege IAM policies before exposing this setup.
- The MongoDB PersistentVolume uses node-local `hostPath`; it does not provide production-grade persistence or high availability.
- The frontend and backend Dockerfiles use Node 14, and the frontend container runs the Create React App development server. Review supported runtime versions and use a production web-server build for production deployments.
- The backend package's `test` script is a placeholder that exits with an error; no functioning automated test suite is configured by that script.
- Authentication/authorization and HTTPS/TLS are not implemented by the application itself.
- Review the Jenkins install script and Terraform-generated infrastructure for your operating system, AWS region, Jenkins version, and security requirements before use.

## License

See [LICENSE](LICENSE).
