#!/bin/bash

# Property Management Service Script
# Controls PostgreSQL backend and React frontend servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service configuration
BACKEND_DIR="server"
FRONTEND_DIR="."
BACKEND_PORT=5000
FRONTEND_PORT=3001
PID_FILE="./.service_pids"
LOG_FILE="./service.log"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[SERVICE]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to get PID of process on port
get_pid_on_port() {
    local port=$1
    lsof -ti :$port 2>/dev/null
}

# Function to start the service
start_service() {
    print_status "Starting Property Management Service..."
    
    # Check if service is already running
    if check_port $BACKEND_PORT; then
        print_warning "Backend is already running on port $BACKEND_PORT"
    else
        print_info "Starting PostgreSQL backend..."
        cd $BACKEND_DIR
        npm start > ../$LOG_FILE 2>&1 &
        local backend_pid=$!
        echo "BACKEND_PID=$backend_pid" >> ../$PID_FILE
        cd ..
        print_status "Backend started with PID: $backend_pid"
        
        # Wait for backend to start
        sleep 3
        if check_port $BACKEND_PORT; then
            print_status "Backend is running on port $BACKEND_PORT"
        else
            print_error "Backend failed to start"
            return 1
        fi
    fi
    
    if check_port $FRONTEND_PORT; then
        print_warning "Frontend is already running on port $FRONTEND_PORT"
    else
        print_info "Starting React frontend..."
        npm start >> $LOG_FILE 2>&1 &
        local frontend_pid=$!
        echo "FRONTEND_PID=$frontend_pid" >> $PID_FILE
        print_status "Frontend started with PID: $frontend_pid"
        
        # Wait for frontend to start
        sleep 5
        if check_port $FRONTEND_PORT; then
            print_status "Frontend is running on port $FRONTEND_PORT"
        else
            print_error "Frontend failed to start"
            return 1
        fi
    fi
    
    print_status "Property Management Service is now running!"
    print_info "Frontend: http://localhost:$FRONTEND_PORT"
    print_info "Backend API: http://localhost:$BACKEND_PORT"
    print_info "Logs: $LOG_FILE"
    print_info "PIDs: $PID_FILE"
}

# Function to stop the service
stop_service() {
    print_status "Stopping Property Management Service..."
    
    if [ -f "$PID_FILE" ]; then
        # Read PIDs from file
        while IFS= read -r line; do
            if [[ $line == BACKEND_PID=* ]]; then
                backend_pid=${line#BACKEND_PID=}
                if kill -0 $backend_pid 2>/dev/null; then
                    kill $backend_pid
                    print_status "Backend stopped (PID: $backend_pid)"
                fi
            elif [[ $line == FRONTEND_PID=* ]]; then
                frontend_pid=${line#FRONTEND_PID=}
                if kill -0 $frontend_pid 2>/dev/null; then
                    kill $frontend_pid
                    print_status "Frontend stopped (PID: $frontend_pid)"
                fi
            fi
        done < "$PID_FILE"
        
        rm -f "$PID_FILE"
    else
        print_warning "No PID file found. Trying to stop by port..."
        
        # Try to stop by port
        backend_pid=$(get_pid_on_port $BACKEND_PORT)
        if [ ! -z "$backend_pid" ]; then
            kill $backend_pid
            print_status "Backend stopped (PID: $backend_pid)"
        fi
        
        frontend_pid=$(get_pid_on_port $FRONTEND_PORT)
        if [ ! -z "$frontend_pid" ]; then
            kill $frontend_pid
            print_status "Frontend stopped (PID: $frontend_pid)"
        fi
    fi
    
    print_status "Property Management Service stopped"
}

# Function to check service status
check_status() {
    print_status "Checking Property Management Service status..."
    
    backend_running=false
    frontend_running=false
    
    if check_port $BACKEND_PORT; then
        backend_pid=$(get_pid_on_port $BACKEND_PORT)
        print_status "Backend is running on port $BACKEND_PORT (PID: $backend_pid)"
        backend_running=true
    else
        print_error "Backend is not running"
    fi
    
    if check_port $FRONTEND_PORT; then
        frontend_pid=$(get_pid_on_port $FRONTEND_PORT)
        print_status "Frontend is running on port $FRONTEND_PORT (PID: $frontend_pid)"
        frontend_running=true
    else
        print_error "Frontend is not running"
    fi
    
    if [ "$backend_running" = true ] && [ "$frontend_running" = true ]; then
        print_status "Service is fully operational"
    elif [ "$backend_running" = true ] || [ "$frontend_running" = true ]; then
        print_warning "Service is partially running"
    else
        print_error "Service is not running"
    fi
}

# Function to restart the service
restart_service() {
    print_status "Restarting Property Management Service..."
    stop_service
    sleep 2
    start_service
}

# Function to show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        print_info "Showing last 50 lines of service logs:"
        tail -50 $LOG_FILE
    else
        print_warning "No log file found"
    fi
}

# Function to follow logs
follow_logs() {
    if [ -f "$LOG_FILE" ]; then
        print_info "Following service logs (Ctrl+C to stop):"
        tail -f $LOG_FILE
    else
        print_warning "No log file found"
    fi
}

# Main script logic
case "$1" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs
        ;;
    follow-logs)
        follow_logs
        ;;
    *)
        echo "Property Management Service Control"
        echo "Usage: $0 {start|stop|restart|status|logs|follow-logs}"
        echo ""
        echo "Commands:"
        echo "  start        - Start both backend and frontend servers"
        echo "  stop         - Stop both backend and frontend servers"
        echo "  restart      - Restart both servers"
        echo "  status       - Check service status"
        echo "  logs         - Show last 50 lines of logs"
        echo "  follow-logs  - Follow logs in real-time"
        echo ""
        echo "Ports:"
        echo "  Backend:     $BACKEND_PORT"
        echo "  Frontend:    $FRONTEND_PORT"
        exit 1
        ;;
esac
