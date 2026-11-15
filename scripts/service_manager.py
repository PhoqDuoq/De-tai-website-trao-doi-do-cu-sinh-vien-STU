"""
STU Marketplace - Service Manager (Python Native)
Starts, checks health, and stops all 7 services cleanly without WMI dependencies.
"""

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

SERVICES = [
    {"name": "identity-service", "port": 8081, "jar": "identity-service/target/identity-service-1.0.0-SNAPSHOT.jar"},
    {"name": "listing-service", "port": 8082, "jar": "listing-service/target/listing-service-1.0.0-SNAPSHOT.jar"},
    {"name": "interaction-service", "port": 8083, "jar": "interaction-service/target/interaction-service-1.0.0-SNAPSHOT.jar"},
    {"name": "transaction-service", "port": 8084, "jar": "transaction-service/target/transaction-service-1.0.0-SNAPSHOT.jar"},
    {"name": "moderation-service", "port": 8085, "jar": "moderation-service/target/moderation-service-1.0.0-SNAPSHOT.jar"},
    {"name": "billing-service", "port": 8086, "jar": "billing-service/target/billing-service-1.0.0-SNAPSHOT.jar"},
    {"name": "api-gateway", "port": 8080, "jar": "api-gateway/target/api-gateway-1.0.0-SNAPSHOT.jar"}
]

LOGS_DIR = os.path.abspath("logs")
PIDS_FILE = os.path.join(LOGS_DIR, "pids.json")

def stop_all():
    print("Stopping all services...")
    if os.path.exists(PIDS_FILE):
        try:
            with open(PIDS_FILE, "r", encoding="utf-8") as f:
                pids_data = json.load(f)
            for item in pids_data:
                pid = item.get("pid")
                if pid:
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)],
                                   capture_output=True, text=True)
                    print(f"Killed {item.get('name')} (PID: {pid})")
            os.remove(PIDS_FILE)
        except Exception as e:
            print(f"Error reading pids file: {e}")

    # Also check by ports
    for svc in SERVICES:
        port = svc["port"]
        try:
            cmd = f'powershell -Command "Get-NetTCPConnection -LocalPort {port} -State Listen -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }}"'
            subprocess.run(cmd, shell=True, capture_output=True)
        except Exception:
            pass
    print("All services stopped.")

def start_all():
    stop_all()
    time.sleep(2)
    os.makedirs(LOGS_DIR, exist_ok=True)
    
    pids_list = []
    flags = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS

    for svc in SERVICES:
        name = svc["name"]
        port = svc["port"]
        jar_path = os.path.abspath(svc["jar"])
        log_path = os.path.join(LOGS_DIR, f"{name}.log")

        if not os.path.exists(jar_path):
            print(f"ERROR: JAR not found: {jar_path}")
            continue

        log_file = open(log_path, "w", encoding="utf-8")
        args = ["java", "-Xms128m", "-Xmx256m", "-jar", jar_path]
        
        proc = subprocess.Popen(args, stdout=log_file, stderr=subprocess.STDOUT, creationflags=flags)
        print(f"Started {name} on port {port} (PID: {proc.pid})")
        pids_list.append({"name": name, "port": port, "pid": proc.pid})

    with open(PIDS_FILE, "w", encoding="utf-8") as f:
        json.dump(pids_list, f, indent=2)

def check_status():
    print("\nActuator Health Status Summary:")
    print("=" * 45)
    all_up = True
    for svc in SERVICES:
        name = svc["name"]
        port = svc["port"]
        url = f"http://localhost:{port}/actuator/health"
        status_str = "DOWN"
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                status_str = data.get("status", "UNKNOWN")
                if status_str != "UP":
                    all_up = False
        except Exception as e:
            status_str = f"NOT_REACHABLE ({type(e).__name__})"
            all_up = False
        
        flag = "[UP]  " if status_str == "UP" else "[DOWN]"
        print(f"{flag} {name.ljust(22)} (Port {port}) -> {status_str}")
    print("=" * 45)
    print(f"Overall status: {'ALL UP' if all_up else 'NOT ALL UP'}\n")
    return all_up

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "status"
    if action == "start":
        start_all()
    elif action == "stop":
        stop_all()
    elif action == "restart":
        start_all()
    elif action == "status":
        up = check_status()
        sys.exit(0 if up else 1)
    else:
        print(f"Unknown action: {action}")
        sys.exit(1)
