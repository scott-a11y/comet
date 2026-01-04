# Comet Codebase Cleanup Script
# Organizes documentation and archives old files

Write-Host "Starting Comet codebase cleanup..." -ForegroundColor Cyan
Write-Host ""

# Create directory structure
Write-Host "Creating directory structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "docs\guides" | Out-Null
New-Item -ItemType Directory -Force -Path "docs\technical" | Out-Null
New-Item -ItemType Directory -Force -Path "docs\setup" | Out-Null
New-Item -ItemType Directory -Force -Path "archive\2026-01-02" | Out-Null
New-Item -ItemType Directory -Force -Path "archive\deployment" | Out-Null
New-Item -ItemType Directory -Force -Path "archive\status" | Out-Null
New-Item -ItemType Directory -Force -Path "archive\audits" | Out-Null
New-Item -ItemType Directory -Force -Path "archive\misc" | Out-Null

# Move active docs to docs/
Write-Host "Moving active documentation..." -ForegroundColor Yellow
Move-Item -Path "ARCHITECTURE.md" -Destination "docs\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "NEXT_LEVEL_ROADMAP.md" -Destination "docs\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "PRODUCTION_READINESS.md" -Destination "docs\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "ENTERPRISE_ASSESSMENT.md" -Destination "docs\" -Force -ErrorAction SilentlyContinue

# Move guides
Write-Host "Moving user guides..." -ForegroundColor Yellow
Move-Item -Path "WALL_DESIGNER_GUIDE.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "DUST_COLLECTION_GUIDE.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "SYSTEMS_QUICK_REFERENCE.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "INTELLIGENT_SYSTEM_INTEGRATION.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue

# Move technical docs
Write-Host "Moving technical documentation..." -ForegroundColor Yellow
Move-Item -Path "ENHANCEMENT_SUMMARY.md" -Destination "docs\technical\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "DEPLOYMENT_STATUS.md" -Destination "docs\technical\" -Force -ErrorAction SilentlyContinue

# Move setup docs
Write-Host "Moving setup documentation..." -ForegroundColor Yellow
Move-Item -Path "SETUP.md" -Destination "docs\setup\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "PRODUCTION_ENV_TEMPLATE.md" -Destination "docs\setup\" -Force -ErrorAction SilentlyContinue

# Archive old deployment docs
Write-Host "Archiving old deployment docs..." -ForegroundColor Yellow
Move-Item -Path "DEPLOYMENT.md" -Destination "archive\deployment\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "DEPLOYMENT_SUCCESS.md" -Destination "archive\deployment\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "DEPLOYMENT_SUMMARY.md" -Destination "archive\deployment\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "DEPLOY_NOW.md" -Destination "archive\deployment\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "FINAL_DEPLOYMENT_STATUS.md" -Destination "archive\deployment\" -Force -ErrorAction SilentlyContinue

# Archive old status files
Write-Host "Archiving old status files..." -ForegroundColor Yellow
Move-Item -Path "BUILD_STATUS.md" -Destination "archive\status\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "FINAL_STATUS.md" -Destination "archive\status\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "PROJECT_STATUS.md" -Destination "archive\status\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "SYNC_STATUS.md" -Destination "archive\status\" -Force -ErrorAction SilentlyContinue

# Archive audit reports
Write-Host "Archiving audit reports..." -ForegroundColor Yellow
Move-Item -Path "AUDIT_REPORT_2026-01-02.md" -Destination "archive\2026-01-02\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "ERROR_FIXES_2026-01-02.md" -Destination "archive\2026-01-02\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "PRODUCTION_READINESS_2026-01-03.md" -Destination "archive\2026-01-02\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "AUDIT_FIXES.md" -Destination "archive\audits\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "BULLETPROOFING_AUDIT.md" -Destination "archive\audits\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "WALL_CODE_REVIEW.md" -Destination "archive\audits\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "WALL_CODE_REVIEW_SUMMARY.md" -Destination "archive\audits\" -Force -ErrorAction SilentlyContinue

# Archive miscellaneous
Write-Host "Archiving miscellaneous files..." -ForegroundColor Yellow
Move-Item -Path "ALL_FEATURES_READY.md" -Destination "archive\misc\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "ANTIGRAVITY_GUIDE.md" -Destination "archive\misc\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "CABINET_DESIGN_SYSTEM_PLAN.md" -Destination "archive\misc\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "CRITICAL_ISSUES.md" -Destination "archive\misc\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "FEATURE_MAP.md" -Destination "archive\misc\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "FIXES_APPLIED.md" -Destination "archive\misc\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "IMPLEMENTATION_CHECKLIST.md" -Destination "archive\misc\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "MECHANICAL_SYSTEMS_COMPLETE.md" -Destination "archive\misc\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "MECHANICAL_SYSTEMS_IMPROVEMENTS.md" -Destination "archive\misc\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "SIMPLE_FIX.md" -Destination "archive\misc\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "vercel-debug.txt" -Destination "archive\misc\" -Force -ErrorAction SilentlyContinue

# Delete build artifacts
Write-Host "Removing build artifacts..." -ForegroundColor Yellow
Remove-Item -Path "tsconfig.tsbuildinfo" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Active docs moved to: docs/" -ForegroundColor White
Write-Host "  - Old files archived to: archive/" -ForegroundColor White

# Count remaining markdown files in root
$mdFiles = (Get-ChildItem -Path "." -Filter "*.md" -File | Measure-Object).Count
Write-Host "  - Markdown files in root: $mdFiles" -ForegroundColor White

Write-Host ""
Write-Host "Your codebase is now clean and organized!" -ForegroundColor Green
