import json
import os

def convert_json_to_env(json_file_path, env_file_path):
    try:
        # Read the JSON file
        with open(json_file_path, 'r') as json_file:
            data = json.load(json_file)
        
        # Create environment variables
        env_vars = {
            "FIREBASE_PROJECT_ID": data.get("project_id", ""),
            "FIREBASE_PRIVATE_KEY_ID": data.get("private_key_id", ""),
            "FIREBASE_PRIVATE_KEY": data.get("private_key", ""),
            "FIREBASE_CLIENT_EMAIL": data.get("client_email", ""),
            "FIREBASE_CLIENT_ID": data.get("client_id", ""),
            "FIREBASE_CLIENT_CERT_URL": data.get("client_x509_cert_url", "")
        }
        
        # Write to .env file
        with open(env_file_path, 'w') as env_file:
            for key, value in env_vars.items():
                # Handle special characters in private key
                if key == "FIREBASE_PRIVATE_KEY":
                    value = value.replace('\n', '\\n')
                env_file.write(f'{key}="{value}"\n')
        
        print(f"Successfully converted {json_file_path} to {env_file_path}")
        print("Environment variables created:")
        for key in env_vars.keys():
            print(f"- {key}")
            
    except FileNotFoundError:
        print(f"Error: {json_file_path} not found")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON file")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Get the directory of the current script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Default paths
    json_file = os.path.join(current_dir, "/home/hannan/Downloads/telemedicine-1dec4-firebase-adminsdk-fbsvc-9a5eb88634.json")
    env_file = os.path.join(current_dir, ".env")
    
    # Convert JSON to .env
    convert_json_to_env(json_file, env_file) 