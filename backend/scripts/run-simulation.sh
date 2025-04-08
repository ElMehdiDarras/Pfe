#!/bin/bash
# run-simulation.sh - A script to run the AlarmManager simulation tools

# ANSI color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
CLEAR_DB=false
HISTORICAL_DAYS=30
HISTORICAL_ALARMS=10
REALTIME_INTERVAL=15
REALTIME_DURATION=30
USE_PATTERNS=true
SPECIFIC_SITE=""
SPECIFIC_EQUIPMENT=""

# Banner function
show_banner() {
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}       AlarmManager Simulation Runner           ${NC}"
  echo -e "${BLUE}================================================${NC}"
  echo
}

# Help function
show_help() {
  echo -e "${CYAN}Usage:${NC} $0 [options]"
  echo
  echo -e "${CYAN}Options:${NC}"
  echo "  -c, --clear           Clear existing data before populating"
  echo "  -d, --days <n>        Number of days of historical data (default: 30)"
  echo "  -a, --alarms <n>      Historical alarms per site per day (default: 10)"
  echo "  -i, --interval <n>    Interval between real-time alarms in seconds (default: 15)"
  echo "  -t, --time <n>        Duration of real-time simulation in minutes (default: 30)"
  echo "  -s, --site <name>     Target a specific site by name"
  echo "  -e, --equipment <t>   Target a specific equipment type"
  echo "  -n, --no-patterns     Disable realistic alarm patterns"
  echo "  -h, --historical-only Run only the historical data population"
  echo "  -r, --realtime-only   Run only the real-time simulation"
  echo "  --help                Show this help message"
  echo
  echo -e "${CYAN}Examples:${NC}"
  echo "  $0 --clear --days 60"
  echo "  $0 --historical-only --alarms 20"
  echo "  $0 --realtime-only --interval 5 --time 60"
  echo "  $0 --site \"Rabat Hay NAHDA\" --no-patterns"
  echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -c|--clear)
      CLEAR_DB=true
      shift
      ;;
    -d|--days)
      HISTORICAL_DAYS="$2"
      shift 2
      ;;
    -a|--alarms)
      HISTORICAL_ALARMS="$2"
      shift 2
      ;;
    -i|--interval)
      REALTIME_INTERVAL="$2"
      shift 2
      ;;
    -t|--time)
      REALTIME_DURATION="$2"
      shift 2
      ;;
    -s|--site)
      SPECIFIC_SITE="$2"
      shift 2
      ;;
    -e|--equipment)
      SPECIFIC_EQUIPMENT="$2"
      shift 2
      ;;
    -n|--no-patterns)
      USE_PATTERNS=false
      shift
      ;;
    -h|--historical-only)
      HISTORICAL_ONLY=true
      shift
      ;;
    -r|--realtime-only)
      REALTIME_ONLY=true
      shift
      ;;
    --help)
      show_banner
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}" >&2
      show_help
      exit 1
      ;;
  esac
done

# Function to check for required tools
check_requirements() {
  echo -e "${BLUE}Checking requirements...${NC}"
  
  # Check for Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is required but not installed.${NC}"
    exit 1
  fi
  
  # Check for required scripts
  if [ ! -f ./scripts/populateHistoricalData.js ] && [ ! -f ./backend/scripts/populateHistoricalData.js ]; then
    echo -e "${RED}Historical data script not found.${NC}"
    echo -e "${RED}Make sure you're in the right directory or the script exists at ./scripts/ or ./backend/scripts/${NC}"
    exit 1
  fi
  
  if [ ! -f ./scripts/simulateRealTimeAlarms.js ] && [ ! -f ./backend/scripts/simulateRealTimeAlarms.js ]; then
    echo -e "${RED}Real-time simulation script not found.${NC}"
    echo -e "${RED}Make sure you're in the right directory or the script exists at ./scripts/ or ./backend/scripts/${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}All requirements satisfied.${NC}"
  echo
}

# Function to determine script paths
get_script_paths() {
  # Find the historical data script
  if [ -f ./scripts/populateHistoricalData.js ]; then
    HISTORICAL_SCRIPT="./scripts/populateHistoricalData.js"
  elif [ -f ./backend/scripts/populateHistoricalData.js ]; then
    HISTORICAL_SCRIPT="./backend/scripts/populateHistoricalData.js"
  else
    echo -e "${RED}Could not locate historical data script.${NC}"
    exit 1
  fi
  
  # Find the real-time simulation script
  if [ -f ./scripts/simulateRealTimeAlarms.js ]; then
    REALTIME_SCRIPT="./scripts/simulateRealTimeAlarms.js"
  elif [ -f ./backend/scripts/simulateRealTimeAlarms.js ]; then
    REALTIME_SCRIPT="./backend/scripts/simulateRealTimeAlarms.js"
  else
    echo -e "${RED}Could not locate real-time simulation script.${NC}"
    exit 1
  fi
}

# Function to run historical data population
run_historical() {
  echo -e "${BLUE}Running historical data population...${NC}"
  
  # Construct command
  CMD="node $HISTORICAL_SCRIPT --days $HISTORICAL_DAYS --alarms $HISTORICAL_ALARMS"
  
  # Add options
  if [ "$CLEAR_DB" = true ]; then
    CMD="$CMD --clear"
  fi
  
  if [ "$USE_PATTERNS" = true ]; then
    CMD="$CMD --demo"
  fi
  
  if [ ! -z "$SPECIFIC_SITE" ]; then
    CMD="$CMD --site \"$SPECIFIC_SITE\""
  fi
  
  # Execute command
  echo -e "${YELLOW}Executing: $CMD${NC}"
  echo
  eval "$CMD"
  
  # Check result
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Historical data population completed successfully.${NC}"
  else
    echo -e "${RED}Historical data population failed.${NC}"
    exit 1
  fi
  
  echo
}

# Function to run real-time simulation
run_realtime() {
  echo -e "${BLUE}Running real-time alarm simulation...${NC}"
  
  # Construct command
  CMD="node $REALTIME_SCRIPT --interval $(($REALTIME_INTERVAL * 1000)) --duration $REALTIME_DURATION"
  
  # Add options
  if [ "$USE_PATTERNS" = true ]; then
    CMD="$CMD --patterns"
  fi
  
  if [ ! -z "$SPECIFIC_SITE" ]; then
    CMD="$CMD --site \"$SPECIFIC_SITE\""
  fi
  
  if [ ! -z "$SPECIFIC_EQUIPMENT" ]; then
    CMD="$CMD --equipment \"$SPECIFIC_EQUIPMENT\""
  fi
  
  # Execute command
  echo -e "${YELLOW}Executing: $CMD${NC}"
  echo -e "${YELLOW}Press Ctrl+C to stop the simulation when done${NC}"
  echo
  eval "$CMD"
  
  # We don't check the result here because the user might Ctrl+C
  echo
  echo -e "${GREEN}Real-time simulation completed.${NC}"
}

# Main function
main() {
  show_banner
  check_requirements
  get_script_paths
  
  echo -e "${BLUE}AlarmManager Simulation Configuration:${NC}"
  echo -e "  Historical days: ${CYAN}$HISTORICAL_DAYS${NC}"
  echo -e "  Historical alarms per site per day: ${CYAN}$HISTORICAL_ALARMS${NC}"
  echo -e "  Real-time interval: ${CYAN}$REALTIME_INTERVAL seconds${NC}"
  echo -e "  Real-time duration: ${CYAN}$REALTIME_DURATION minutes${NC}"
  echo -e "  Using patterns: ${CYAN}$USE_PATTERNS${NC}"
  if [ ! -z "$SPECIFIC_SITE" ]; then
    echo -e "  Target site: ${CYAN}$SPECIFIC_SITE${NC}"
  fi
  if [ ! -z "$SPECIFIC_EQUIPMENT" ]; then
    echo -e "  Target equipment: ${CYAN}$SPECIFIC_EQUIPMENT${NC}"
  fi
  echo
  
  # Ask for confirmation if not in historical-only or realtime-only mode
  if [ -z "$HISTORICAL_ONLY" ] && [ -z "$REALTIME_ONLY" ]; then
    read -p "This will run both historical and real-time simulations. Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${RED}Operation cancelled.${NC}"
      exit 0
    fi
  fi
  
  # Run selected simulations
  if [ "$REALTIME_ONLY" = true ]; then
    run_realtime
  elif [ "$HISTORICAL_ONLY" = true ]; then
    run_historical
  else
    run_historical
    run_realtime
  fi
  
  echo -e "${GREEN}All simulations completed successfully.${NC}"
}

# Run the main function
main
