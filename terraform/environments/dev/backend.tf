terraform {
  backend "s3" {
    bucket         = "dvd-shop-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "dvd-shop-terraform-locks"
  }
}

provider "aws" {
  region = "eu-west-1"

  default_tags {
    tags = {
      Environment = "dev"
      Project     = "dvd-shop-calculator"
      ManagedBy   = "Terraform"
    }
  }
}

module "root" {
  source = "../../"

  app_name    = "dvd-shop-calculator"
  environment = "dev"
}
