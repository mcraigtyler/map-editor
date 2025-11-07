# Development Notes

Below are my notes on what I did to get this project working with the help of an AI Agent. The goal of this project was to see if one person could create a working Map Editor in a condensed time-frame with maintainable code.

## Instuctions

I started with a set of instructions which can be used across projects. These are programming language instructions which are not specific to the project. (react.instructions.md, typescript.instructions.md) I had AI assist me in creating these files, but I reviewed and tweaked these files in great detail. This is an ever changing set of instructions as I learn better ways to writing code in these langauges.

## Project Requirements Document (PRD)

After the initial set of language instruction files I had AI assist me in creating a PRD for this project. I had an initial prompt for what I wanted, but had the Agent ask me clarifying questions to complete the document. After the Agent generated the document I reviewed in great detail and made my own changes.

## Architecture

Once the Plan was in place I had the Agent help me come up with a high level architecture document for the project. This included a tech stack, folder structure, responsibilities and diagrams for how all the pieces fit together.

## Plan

Once all the documentation was in place for what I wanted, I had the Agent help me come up with a Plan for how to implement the project. Because I wanted to get this done quickly I had it generate a high level set of phased tasks. For greater control over what is generated I think it would be a better practice to break the Plan down further into separate Task files for each phase, but due to time constraints I opted to a higher level set of phased tasks and let the Agent generate larger chunks of fuctionality per prompt.

## Implementation

With a plan in place with a phased breakdown of the work, I then started prompting the Agent to implement each phase of the plan. Each prommpt was short 'Implement Phase X of the #Plan.md'. For these phases I used ChatGPT Codex so that it would interate on the solution and ensure what it came up with passed certain checks: lint, build, test. I would review what it came up with in the form of a Pull Request which Codex created for each phase of the implementation.

During my review process I would then use the Copilot extension from within VS Code to make tweaks. This allowed for faster iteration instead of waiting on the slower codex to make these smaller modifications. Once the code was to my liking I would apporove the PR and merge it then start the process over with the next Phase of the Plan.

## All Plans Change

During the Implementation process I needed to make tweaks to the plan, either by modifying it to allow for the AI Agent to produce code closer to what I wanted, or to add new features which I had missed in the initial plan.

In some cases I would scarp what the Agent had produced, modify the supporting documents, and try again. In most cases I had to make tweaks to what it produced by using Copilot.

## Results

I view this project as a huge success. I learned a lot going through this excercised on how to better work with an AI Agent to produce a working application that is maintainable. While I would have done things differently given more time, I think this was a huge success in proving AI can make a large impact on the sofware development process.