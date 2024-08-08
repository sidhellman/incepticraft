# InceptiCraft (Beta)

InceptiCraft is an innovative AI-powered software development assistant that revolutionizes the way projects are conceptualized, planned, and executed. By leveraging advanced language models and integrations with popular development tools, InceptiCraft streamlines the entire software development lifecycle, from initial idea to code generation and project management.


Here is a video demonstration:

[Watch the video](https://github.com/sidhellman/incepticraft/blob/master/video%202.mp4)


## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- **AI-Powered Requirement Generation**: Transform a simple project idea into a comprehensive set of epics, tasks, and user stories.
- **Automatic Architecture Design**: Generate system architecture diagrams based on the project requirements.
- **Pseudocode Generation**: Produce high-level pseudocode to guide implementation.
- **Code Generation**: Create boilerplate code for user stories to jumpstart development.
- **Jira Integration**: Automatically push generated epics, tasks, and user stories to Jira for seamless project management.
- **Interactive UI**: User-friendly interface for inputting ideas and viewing generated content.
- **Customizable AI Models**: Choose between different AI models (e.g., GPT-3.5, GPT-4) for generation tasks.
- **Version Control Integration**: (Planned) Automatic context pulling and pushing to GitHub and GitLab.

## How It Works

1. **Idea Input**: Users input their project idea into InceptiCraft's interface.
2. **AI Processing**: The system uses advanced AI models to analyze the input and generate a structured project plan.
3. **Requirement Generation**: InceptiCraft creates a hierarchy of epics, tasks, and user stories based on the project idea.
4. **Architecture Design**: An architecture diagram is automatically generated to visualize the system components and their interactions.
5. **Code Generation**: For each user story, InceptiCraft can generate pseudocode or actual code snippets to guide implementation.
6. **Jira Integration**: All generated items are automatically pushed to Jira, creating a ready-to-use project structure.
7. **Iterative Refinement**: Users can provide feedback and refine the generated content through the UI.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14 or later)
- npm (v6 or later)
- Access to OpenAI API or Anthropic API
- Jira account with API access
- (Optional) Ollama setup for local AI model hosting

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/sidtiwari2712/incepticraft.git
   cd incepticraft
   ```

2. Install dependencies for both backend and frontend:
   ```
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Set up environment variables (see Configuration section below)

## Configuration

Create a `.env` file in the `backend` directory with the following variables:

```
# Server Configuration
PORT=5001

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Anthropic Configuration (optional)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Jira API Configuration
JIRA_API_BASE=https://your-domain.atlassian.net
JIRA_EMAIL=your_jira_email@example.com
JIRA_API_TOKEN=your_jira_api_token

# Ollama API Configuration (if using local models)
OLLAMA_API_BASE=http://your-ollama-server:11434/api

# Add any other environment-specific variables below
```

Replace the placeholder values with your actual API keys and configuration details.

## Usage

1. Start the backend server:
   ```
   cd backend && npm start
   ```

2. In a new terminal, start the frontend development server:
   ```
   cd frontend && npm start
   ```

3. Open your browser and navigate to `http://localhost:3000` to use InceptiCraft.

4. Enter your project idea in the input field and click "Generate" to start the AI-powered project planning process.

5. Review the generated epics, tasks, and user stories in the respective tabs.

6. Use the "Generate Architecture" button to create a system architecture diagram.

7. For each user story, you can generate code snippets using the "Generate Code" button.

8. All generated items can be automatically pushed to your Jira project for further management and tracking.

## Future Enhancements

1. **Version Control Integration**: 
   - Automatically pull context from GitHub and GitLab repositories to inform the AI about existing project structures.
   - Push generated code directly to version control systems, creating branches or pull requests.

2. **CI/CD Pipeline Generation**: 
   - Create CI/CD pipeline configurations based on the project architecture and requirements.

3. **Test Case Generation**: 
   - Automatically generate unit and integration test cases for the created user stories.

4. **Documentation Generation**: 
   - Produce comprehensive project documentation, including API docs and user manuals, based on the generated requirements and code.

5. **Multi-language Support**: 
   - Extend code generation capabilities to support multiple programming languages and frameworks.

6. **AI-powered Code Review**: 
   - Implement an AI-driven code review system that provides suggestions and identifies potential issues in generated or manually written code.

7. **Real-time Collaboration**: 
   - Add features for multiple team members to collaborate on project planning and refinement in real-time.

8. **Natural Language Querying**: 
   - Implement a natural language interface for querying project details and generating reports.

9. **Integration with Additional Tools**: 
   - Expand integrations to include popular project management tools beyond Jira, such as Trello, Asana, or Microsoft Project.

10. **Machine Learning Model Fine-tuning**: 
    - Develop a system to fine-tune the AI models based on user feedback and actual project outcomes, improving accuracy over time.

## Contributing

Contributions to InceptiCraft are welcome. Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## License

InceptiCraft is distributed under the MIT License with Attribution Required. 

```
MIT License

Copyright (c) 2024 Sid Tiwari

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

Additionally, any use of this software must include clear attribution to the
original author, Sid Tiwari, in any documentation, user interfaces, or other
materials provided with the software or derived works.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Contact

Sid Tiwari - sid@tiwaris.net

Project Link: https://github.com/sidhellman/incepticraft
