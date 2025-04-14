## Description
Briefly describe the changes in this pull request

## Changes include
<!-- Mark the options that apply -->
- [ ] Backend changes
- [ ] Frontend changes
- [ ] Infrastructure/deployment changes
- [ ] Documentation updates
- [ ] Tests

## Deployment Process
This repository uses a unified deployment workflow that sequentially deploys both frontend and backend components. When this PR is merged to the main branch, the workflow will:
1. Test the backend
2. Build the frontend
3. Build Docker images for both services
4. Deploy everything to the production server

## Checklist
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] New and existing tests pass locally with my changes

## Screenshots (if applicable)
<!-- Add screenshots to help explain your changes if relevant -->

## Additional notes
<!-- Add any other information that would be helpful for reviewers --> 