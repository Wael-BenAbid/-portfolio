#!/usr/bin/env python
"""
Security Audit Script for Portfolio Project
Checks for common security vulnerabilities and configuration issues
"""

import os
import sys
import re
from pathlib import Path

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

class SecurityAuditor:
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.passed = []
        
    def check(self, condition, passed_msg, failed_msg, is_warning=False):
        """Log a check result"""
        if condition:
            self.passed.append(passed_msg)
            print(f"{GREEN}[OK]{RESET} {passed_msg}")
        else:
            if is_warning:
                self.warnings.append(failed_msg)
                print(f"{YELLOW}[WARN]{RESET} {failed_msg}")
            else:
                self.issues.append(failed_msg)
                print(f"{RED}[ERROR]{RESET} {failed_msg}")
    
    def audit_environment(self):
        """Check environment configuration"""
        print(f"\n{BLUE}=== ENVIRONMENT CONFIGURATION ==={RESET}")
        
        debug_mode = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'
        self.check(
            not debug_mode,
            "DEBUG mode is OFF",
            "DEBUG mode is ON - this exposes sensitive information",
            is_warning=debug_mode
        )
        
        secret_key = os.environ.get('DJANGO_SECRET_KEY')
        self.check(
            secret_key and not 'dev-only-key' in secret_key.lower(),
            "DJANGO_SECRET_KEY is configured",
            "DJANGO_SECRET_KEY is not properly configured"
        )
        
        db_password = os.environ.get('DB_PASSWORD')
        self.check(
            bool(db_password) or debug_mode,
            "Database password is configured",
            "Database password not configured",
            is_warning=not db_password and debug_mode
        )
        
        cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS')
        self.check(
            bool(cors_origins) or debug_mode,
            "CORS origins are configured",
            "CORS origins not configured",
            is_warning=not cors_origins and debug_mode
        )
    
    def audit_settings_file(self):
        """Check settings.py for security issues"""
        print(f"\n{BLUE}=== SETTINGS FILE SECURITY ==={RESET}")
        
        settings_path = Path('backend/portfolio/settings.py')
        if not settings_path.exists():
            print(f"{YELLOW}[WARN]{RESET} Could not find settings.py")
            return
        
        # Read with utf-8 encoding to avoid charmap errors
        settings_content = settings_path.read_text(encoding='utf-8')
        
        # Check for hardcoded secrets
        hardcoded_secrets = re.findall(r"SECRET_KEY\s*=\s*['\"][\w-]+['\"]", settings_content)
        self.check(
            not hardcoded_secrets,
            "No hardcoded SECRET_KEY found",
            "Hardcoded SECRET_KEY detected in settings.py"
        )
        
        # Check for DEBUG
        self.check(
            "DEBUG = os.environ.get('DJANGO_DEBUG'" in settings_content,
            "DEBUG is environment-based",
            "DEBUG configuration may be hardcoded"
        )
        
        # Check for security headers
        self.check(
            "SECURE_BROWSER_XSS_FILTER" in settings_content,
            "XSS protection headers configured",
            "XSS protection headers not configured"
        )
        
        self.check(
            "SECURE_CONTENT_TYPE_NOSNIFF" in settings_content,
            "Content-Type security headers configured",
            "Content-Type security headers not configured"
        )
        
        self.check(
            "SECURE_HSTS_SECONDS" in settings_content,
            "HSTS security headers configured",
            "HSTS security headers not configured"
        )
        
        # Check CSRF
        self.check(
            "CSRF_COOKIE_HTTPONLY" in settings_content,
            "CSRF cookies are HttpOnly",
            "CSRF cookies are not HttpOnly"
        )
        
        # Check password validators
        self.check(
            "AUTH_PASSWORD_VALIDATORS" in settings_content,
            "Password validators are configured",
            "Password validators not configured"
        )
    
    def audit_dependencies(self):
        """Check for vulnerable dependencies"""
        print(f"\n{BLUE}=== DEPENDENCY SECURITY ==={RESET}")
        
        # Check if safety is installed
        try:
            import subprocess
            result = subprocess.run(
                ['pip', 'show', 'safety'],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print(f"{YELLOW}[INFO]{RESET} Run 'safety check' to audit dependencies")
            else:
                print(f"{YELLOW}[INFO]{RESET} Install 'safety' package for vulnerability scanning")
        except Exception as e:
            print(f"{YELLOW}[WARN]{RESET} Could not check safety: {e}")
        
        # Check for common vulnerable packages
        requirements_path = Path('backend/requirements.txt')
        if requirements_path.exists():
            reqs = requirements_path.read_text()
            
            # This is just an example - real versions should be checked
            critical_packages = {
                'django': '4.2',
                'djangorestframework': '3.14',
                'psycopg2': '2.9',
            }
            
            for package, min_version in critical_packages.items():
                self.check(
                    package in reqs,
                    f"{package} is configured",
                    f"{package} is not configured"
                )
    
    def audit_docker(self):
        """Check Docker security"""
        print(f"\n{BLUE}=== DOCKER SECURITY ==={RESET}")
        
        dockerfile_path = Path('backend/Dockerfile')
        if dockerfile_path.exists():
            content = dockerfile_path.read_text()
            
            self.check(
                'USER ' in content,
                "Non-root user is configured in Dockerfile",
                "Docker runs as root (security risk)",
                is_warning=True
            )
            
            self.check(
                'python:3.11-slim' in content,
                "Using minimal Python image",
                "Using bloated Python image"
            )
    
    def audit_git_config(self):
        """Check git configuration"""
        print(f"\n{BLUE}=== GIT SECURITY ==={RESET}")
        
        gitignore_path = Path('.gitignore')
        if gitignore_path.exists():
            content = gitignore_path.read_text(encoding='utf-8')
            
            self.check(
                '.env' in content,
                ".env file is in .gitignore",
                ".env file may be committed to git (security risk)"
            )
            
            self.check(
                '*.key' in content or 'keys/' in content,
                "Key files are in .gitignore",
                "Key files may be committed to git"
            )
    
    def print_summary(self):
        """Print audit summary"""
        print(f"\n{BLUE}=== SECURITY AUDIT SUMMARY ==={RESET}")
        
        total_passed = len(self.passed)
        total_warnings = len(self.warnings)
        total_issues = len(self.issues)
        
        print(f"{GREEN}[OK] Passed: {total_passed}{RESET}")
        print(f"{YELLOW}[WARN] Warnings: {total_warnings}{RESET}")
        print(f"{RED}[ERROR] Issues: {total_issues}{RESET}")
        
        if total_issues == 0 and total_warnings == 0:
            print(f"\n{GREEN}[OK] All security checks passed!{RESET}")
            return 0
        elif total_issues == 0:
            print(f"\n{YELLOW}[WARN] Review warnings before production deployment{RESET}")
            return 1
        else:
            print(f"\n{RED}[ERROR] Critical issues found - fix before deployment{RESET}")
            
            if self.issues:
                print(f"\n{RED}Issues:{RESET}")
                for issue in self.issues:
                    print(f"  • {issue}")
            
            if self.warnings:
                print(f"\n{YELLOW}Warnings:{RESET}")
                for warning in self.warnings:
                    print(f"  • {warning}")
            
            return 1


def main():
    """Run security audit"""
    print(f"{BLUE}{'='*50}")
    print(f"Portfolio Project - Security Audit")
    print(f"{'='*50}{RESET}\n")
    
    auditor = SecurityAuditor()
    
    try:
        auditor.audit_environment()
        auditor.audit_settings_file()
        auditor.audit_dependencies()
        auditor.audit_docker()
        auditor.audit_git_config()
    except Exception as e:
        print(f"{RED}Error during audit: {e}{RESET}")
        return 1
    
    return auditor.print_summary()


if __name__ == '__main__':
    sys.exit(main())
