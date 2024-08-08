const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

const OLLAMA_API_BASE = process.env.OLLAMA_API_BASE;
const OPENAI_API_BASE = "https://api.openai.com/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const JIRA_API_BASE = process.env.JIRA_API_BASE;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

// Axios instance for Jira API calls
const jiraAxios = axios.create({
  baseURL: JIRA_API_BASE,
  auth: {
    username: JIRA_EMAIL,
    password: JIRA_API_TOKEN
  }
});

app.get('/api/models', async (req, res) => {
  try {
    const ollamaResponse = await axios.get(`${OLLAMA_API_BASE}/tags`);
    const ollamaModels = ollamaResponse.data.models.map(model => model.name);

    const openAIModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4'];

    const allModels = [...ollamaModels, ...openAIModels];
    res.json({ models: allModels });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

app.get('/api/generate-requirements', async (req, res) => {
  const { idea, model } = req.query;

  const prompt = `
    Given the following project idea: "${idea}", generate a comprehensive and structured JSON output containing epics, tasks, and stories for a software development project. The output should follow this exact structure:

    {
      "epics": [
        {
          "id": "E1",
          "summary": "Epic Summary",
          "description": "Detailed description of the epic"
        }
      ],
      "tasks": [
        {
          "id": "T1",
          "summary": "Task Summary",
          "acceptanceCriteria": "Detailed acceptance criteria for the task",
          "description": "Detailed description of the task",
          "epicId": "E1"
        }
      ],
      "stories": [
        {
          "id": "S1",
          "summary": "Story Summary",
          "description": "As a [user type], I want [goal] so that [benefit]",
          "epicId": "E1"
        }
      ]
    }

    Guidelines:
    1. Generate 3-5 epics, 2-4 tasks per epic, and 2-3 stories per epic.
    2. Ensure all IDs are unique and follow the format shown (E1, T1, S1, etc.).
    3. Make sure all relationships between epics, tasks, and stories are correctly cross-referenced using epicId.
    4. Provide detailed and specific descriptions for each item.
    5. For stories, follow the "As a [user type], I want [goal] so that [benefit]" format in the description.
    6. Include specific and testable acceptance criteria for each task.
    7. Ensure the entire output is valid JSON that can be parsed without errors.
    8. Do not include any additional text, markdown formatting, or explanations outside the JSON structure.

   strictly Provide only the JSON output without any additional text or formatting. Strictly only provide valid JSON`;

  try {
    let response;
    if (model.startsWith('gpt-')) {
      response = await axios.post(
        `${OPENAI_API_BASE}/chat/completions`,
        {
          model: model,
          messages: [
            { role: "system", content: "You are a helpful assistant that generates project requirements in JSON format. You strictly only generate json no leading or lagging text" },
            { role: "user", content: prompt }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      res.json(JSON.parse(response.data.choices[0].message.content));
    } else {
      response = await axios.post(`${OLLAMA_API_BASE}/chat`, {
        model,
        messages: [{ role: 'user', content: prompt }]
      });
      res.json(JSON.parse(response.data.message.content));
    }
  } catch (error) {
    console.error('Error generating requirements:', error);
    res.status(500).json({ error: 'Failed to generate requirements' });
  }
});

function parseJSONResponse(content) {
  console.log('Attempting to parse JSON content:', content);
  try {
    // First, try to parse the content directly
    return JSON.parse(content);
  } catch (error) {
    // If direct parsing fails, try to clean up the content
    console.error('Error parsing JSON:', error);
    console.error('Raw content:', content);

    // Remove any potential markdown formatting
    let cleanContent = content.replace(/```json\s?|```/g, '').trim();
    console.log('Cleaned content:', cleanContent);

    try {
      // Try parsing the cleaned content
      return JSON.parse(cleanContent);
    } catch (secondError) {
      console.error('Error parsing cleaned JSON:', secondError);
      throw new Error('Invalid JSON response from the model');
    }
  }
}

async function getProjectFields(projectKey) {
  try {
    console.log(`Fetching project fields for project key: ${projectKey}`);
    const response = await jiraAxios.get(`/rest/api/3/issue/createmeta/${projectKey}/issuetypes`);
    console.log('Project metadata response:', JSON.stringify(response.data, null, 2));

    const issueTypes = response.data.issueTypes;
    const fields = {};

    for (const issueType of issueTypes) {
      // Fetch detailed information for each issue type
      const detailedResponse = await jiraAxios.get(`/rest/api/3/issuetype/${issueType.id}`);
      fields[issueType.name.toLowerCase()] = {
        id: issueType.id,
        fields: detailedResponse.data.fields || {} // Use an empty object if fields are not present
      };
    }

    console.log('Processed project fields:', JSON.stringify(fields, null, 2));
    return fields;
  } catch (error) {
    console.error('Error fetching project fields:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function createJiraIssue(projectKey, issueType, summary, description, epicKey = null, acceptanceCriteria = null) {
  try {
    console.log(`Creating Jira issue: ${issueType} for project ${projectKey}`);
    const projectFields = await getProjectFields(projectKey);
    console.log('Issue type:', issueType);
    console.log('Project fields:', JSON.stringify(projectFields, null, 2));

    const issueTypeInfo = projectFields[issueType.toLowerCase()];

    if (!issueTypeInfo) {
      throw new Error(`No valid issue type found for ${issueType}. Available types are: ${Object.keys(projectFields).join(', ')}`);
    }

    const issueData = {
      fields: {
        project: { key: projectKey },
        summary: summary,
        issuetype: { id: issueTypeInfo.id },
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: description }]
            }
          ]
        }
      }
    };

    // Add epic link if applicable
    if (epicKey && issueType.toLowerCase() !== 'epic') {
      const epicLinkField = Object.entries(issueTypeInfo.fields).find(([_, field]) => field.name === 'Epic Link');
      if (epicLinkField) {
        issueData.fields[epicLinkField[0]] = epicKey;
      } else {
        console.warn('Epic Link field not found for this issue type');
      }
    }

    // Add acceptance criteria if applicable
    if (acceptanceCriteria) {
      const acceptanceCriteriaField = Object.entries(issueTypeInfo.fields).find(([_, field]) => field.name === 'Acceptance Criteria');
      if (acceptanceCriteriaField) {
        issueData.fields[acceptanceCriteriaField[0]] = {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: acceptanceCriteria }]
            }
          ]
        };
      } else {
        console.warn('Acceptance Criteria field not found for this issue type');
      }
    }

    console.log('Sending Jira request with data:', JSON.stringify(issueData, null, 2));

    const response = await jiraAxios.post('/rest/api/3/issue', issueData);
    console.log('Jira response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error creating Jira issue:', error.response ? error.response.data : error.message);
    throw error;
  }
}

app.post('/api/generate-code', async (req, res) => {
  const { story, model } = req.body;

  try {
    const prompt = `Generate code for the following user story:
    ${story.summary}
    ${story.description}
    
    Please provide a code snippet that implements this user story.`;

    let response;
    if (model.startsWith('gpt-')) {
      response = await axios.post(`${OPENAI_API_BASE}/chat/completions`, {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      res.json({ code: response.data.choices[0].message.content });
    } else {
      response = await axios.post(`${OLLAMA_API_BASE}/chat`, {
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      });
      res.json({ code: response.data.message.content });
    }
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

const sanitizePlantUMLString = (plantUMLString) => {
  // Remove markdown code block syntax and any leading/trailing whitespace
  let sanitized = plantUMLString.replace(/^```[\s\S]*?\n|```$/gm, '').trim();

  // Remove any remaining backticks
  sanitized = sanitized.replace(/`/g, '');

  // Ensure it starts with "@startuml"
  if (!sanitized.startsWith('@startuml')) {
    sanitized = '@startuml\n' + sanitized;
  }

  // Ensure it ends with "@enduml"
  if (!sanitized.endsWith('@enduml')) {
    sanitized += '\n@enduml';
  }

  // Remove any non-ASCII characters
  sanitized = sanitized.replace(/[^\x00-\x7F]/g, "_");

  return sanitized;
};

// app.post('/api/generate-architecture', async (req, res) => {
//   const { requirements, userStories, model } = req.body;
//
//   try {
//     const prompt = `Strictly only generate valid PlantUML diagram for system architecture based on the following project requirements and user stories. Strictly never add any additional text or any extra explanation preceding or at the end or inside the PlantUML:
//     Epics: ${JSON.stringify(requirements)}
//     User Stories: ${JSON.stringify(userStories)}
//
//     Provide a valid PlantUML string that represents the comprehensive system architecture of this project. The diagram must include and clearly show:
//     1. Frontend components and their interactions
//     2. Backend services and APIs
//     3. Middleware components
//     4. Databases and data stores
//     5. Authentication and authorization systems
//     6. External services and integrations
//     7. Network boundaries and security measures
//     8. Message queues or event buses if applicable
//     9. Caching mechanisms
//     10. Load balancers and scaling components
//     11. Monitoring and logging systems
//     12. User interactions and data flow
//
//     Use different shapes, colors, and styles to distinguish between component types. Include a legend to explain the symbols used.
//
//     Guidelines:
//     - Use appropriate PlantUML notation for different component types (e.g., [Component], database, cloud, etc.)
//     - Show relationships and interactions between components using arrows and appropriate labels
//     - Group related components using packages or boundaries
//     - Include stereotypes to provide additional context (e.g., <<service>>, <<database>>, <<frontend>>)
//     - Use notes to explain important aspects or decisions in the architecture
//     - Ensure the diagram is detailed, comprehensive, and reflects all aspects of the system described in the requirements and user stories
//     - Make sure you always use best colors and proper stacking to capture all details, and system architetcures
//     - Make the diagram exhaustive and detailed.
//     - Strictly provide valid PlantUML code
//     - Properly label system components for example which database, which servers, what frontend technology etc
//
//     Provide only the PlantUML code without any additional explanation or text. Your response should start with '@startuml' and end with '@enduml'.`;
//
//     let architecture;
//     if (model.startsWith('gpt-')) {
//       const response = await axios.post(`${OPENAI_API_BASE}/chat/completions`, {
//         model: model,
//         messages: [{ role: 'user', content: prompt }],
//         temperature: 0.7
//       }, {
//         headers: {
//           'Authorization': `Bearer ${OPENAI_API_KEY}`,
//           'Content-Type': 'application/json'
//         }
//       });
//       architecture = response.data.choices[0].message.content;
//     } else {
//       const response = await axios.post(`${OLLAMA_API_BASE}/chat`, {
//         model,
//         messages: [{ role: 'user', content: prompt }],
//         stream: false
//       });
//       architecture = response.data.message.content;
//     }
//
//     // Sanitize and correct the PlantUML string
//     architecture = sanitizePlantUMLString(architecture);
//
//     // Log the sanitized architecture string for debugging
//     console.log('Sanitized PlantUML architecture string:', architecture);
//
//     res.json({ architecture });
//   } catch (error) {
//     console.error('Error generating architecture:', error);
//     res.status(500).json({
//       error: 'Failed to generate valid architecture diagram',
//       details: error.message
//     });
//   }
// });

app.post('/api/generate-pseudocode', async (req, res) => {
  const { epics, tasks, stories } = req.body;

  try {
    const prompt = `Generate comprehensive pseudocode for the entire project based on the following epics, tasks, and user stories:

Epics: ${JSON.stringify(epics)}
Tasks: ${JSON.stringify(tasks)}
User Stories: ${JSON.stringify(stories)}

Guidelines for the pseudocode:
1. Use a clear and consistent structure that outlines the main components and their interactions.
2. Include high-level algorithms and logic flows without delving into specific programming language syntax.
3. Cover all major functionalities described in the epics, tasks, and user stories.
4. Use indentation to show hierarchy and structure.
5. Include comments to explain complex logic or important decisions.
6. Use plain English mixed with general programming concepts (e.g., loops, conditionals, functions).
7. Outline data structures and their purposes without implementing them in detail.
8. Describe API endpoints and their general functionality.
9. Include error handling and edge cases at a high level.
10. Outline any database operations or external service interactions conceptually.

Your response should be structured pseudocode that gives a comprehensive overview of the entire system's functionality.`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 4000,
        messages: [
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    let pseudocode = response.data.content[0].text;

    res.json({ pseudocode });
  } catch (error) {
    console.error('Error generating pseudocode:', error.response ? error.response.data : error);
    res.status(500).json({
      error: 'Failed to generate pseudocode',
      details: error.response ? error.response.data : error.message
    });
  }
});


app.post('/api/generate-architecture', async (req, res) => {
  const { epics, tasks, stories } = req.body;

  try {
    const prompt = `Generate a comprehensive PlantUML diagram for the system architecture based on the following project requirements, tasks, and user stories:

Epics: ${JSON.stringify(epics)}
Tasks: ${JSON.stringify(tasks)}
User Stories: ${JSON.stringify(stories)}

Guidelines:
1. Start the diagram with '@startuml' and end with '@enduml'.
2. Include and clearly show:
   - Frontend components and their interactions
   - Backend services and APIs
   - Middleware components
   - Databases and data stores
   - Authentication and authorization systems
   - External services and integrations
   - Network boundaries and security measures
   - Message queues or event buses if applicable
   - Caching mechanisms
   - Load balancers and scaling components
   - Monitoring and logging systems
   - User interactions and data flow
3. Use different shapes distinguish between component types.
4. Include a legend to explain the symbols used.
5. Use appropriate PlantUML notation for different component types (e.g., [Component], database, cloud, etc.)
6. Show relationships and interactions between components using arrows and appropriate labels.
7. Group related components using packages or boundaries.
9. Use notes to explain important aspects or decisions in the architecture.
10. Ensure the diagram is detailed, comprehensive, and reflects all aspects of the system described in the epics, tasks, and user stories.
11. Make the diagram exhaustive and detailed.
12. Properly label system components (e.g., specify which database, which servers, what frontend technology, etc.).

Your response must contain only valid PlantUML code, with no additional explanations or text before or after the diagram code.`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4000,
        messages: [
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    let architecture = response.data.content[0].text;

    // Sanitize and correct the PlantUML string
    architecture = sanitizePlantUMLString(architecture);

    // Log the sanitized architecture string for debugging
    console.log('Sanitized PlantUML architecture string:', architecture);

    res.json({ architecture });
  } catch (error) {
    console.error('Error generating architecture:', error.response ? error.response.data : error);
    res.status(500).json({
      error: 'Failed to generate valid architecture diagram',
      details: error.response ? error.response.data : error.message
    });
  }
});

app.post('/api/generate-full-code', async (req, res) => {
  const { requirements, userStories, model } = req.body;

  try {
    const prompt = `Generate code for the entire project based on the following requirements and user stories:
    Epics: ${JSON.stringify(requirements)}
    User Stories: ${JSON.stringify(userStories)}
    
    Please provide a comprehensive code structure for this project, including main components, functions, and basic implementations.`;

    let response;
    if (model.startsWith('gpt-')) {
      response = await axios.post(`${OPENAI_API_BASE}/chat/completions`, {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      res.json({ code: response.data.choices[0].message.content });
    } else {
      response = await axios.post(`${OLLAMA_API_BASE}/chat`, {
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      });
      res.json({ code: response.data.message.content });
    }
  } catch (error) {
    console.error('Error generating full code:', error);
    res.status(500).json({ error: 'Failed to generate full code' });
  }
});

app.get('/api/jira-projects', async (req, res) => {
  try {
    const response = await jiraAxios.get('/rest/api/3/project');
    const projects = response.data.map(project => ({
      id: project.id,
      key: project.key,
      name: project.name
    }));
    res.json(projects);
  } catch (error) {
    console.error('Error fetching Jira projects:', error);
    res.status(500).json({ error: 'Failed to fetch Jira projects' });
  }
});

app.post('/api/submit-to-jira', async (req, res) => {
  let { projectKey, item, itemType } = req.body;

  try {
    if (!projectKey) {
      // Fetch the first available project key if none is provided
      const response = await jiraAxios.get('/rest/api/3/project');
      if (response.data.length > 0) {
        projectKey = response.data[0].key;
        console.log(`No project key provided. Using default: ${projectKey}`);
      } else {
        throw new Error('No Jira projects found');
      }
    }

    console.log(`Submitting to Jira: ${itemType} for project ${projectKey}`);
    console.log('Item:', JSON.stringify(item, null, 2));

    let createdIssue;
    let correctedItemType = itemType.toLowerCase();

    // Correct 'storie' to 'story'
    if (correctedItemType === 'storie') {
      correctedItemType = 'story';
    }

    switch (correctedItemType) {
      case 'epic':
        createdIssue = await createJiraIssue(projectKey, 'Epic', item.summary, item.description);
        break;
      case 'task':
        createdIssue = await createJiraIssue(projectKey, 'Task', item.summary, item.description, item.epicId, item.acceptanceCriteria);
        break;
      case 'story':
        createdIssue = await createJiraIssue(projectKey, 'Story', item.summary, item.description, item.epicId);
        break;
      default:
        throw new Error(`Invalid item type: ${itemType}`);
    }

    res.json({ message: 'Successfully created issue in Jira', createdIssue });
  } catch (error) {
    console.error('Error submitting to Jira:', error);
    res.status(500).json({ error: 'Failed to submit to Jira', details: error.message });
  }
});

app.post('/api/rewrite-item', async (req, res) => {
  const { itemType, item, feedback, model } = req.body;

  try {
    console.log(`Rewriting ${itemType} with feedback: ${feedback}`);
    console.log('Original item:', JSON.stringify(item, null, 2));

    const prompt = `Rewrite the following ${itemType} based on this feedback: "${feedback}". 
    Original ${itemType}: ${JSON.stringify(item)}
    Provide the rewritten ${itemType} in the same JSON structure, maintaining all existing fields. Make sure to incorporate the feedback and improve the ${itemType} accordingly.`;

    let response;
    if (model.startsWith('gpt-')) {
      response = await axios.post(`${OPENAI_API_BASE}/chat/completions`, {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      const rewrittenItem = parseJSONResponse(response.data.choices[0].message.content);
      console.log('Rewritten item:', JSON.stringify(rewrittenItem, null, 2));
      res.json(rewrittenItem);
    } else {
      response = await axios.post(`${OLLAMA_API_BASE}/chat`, {
        model,
        messages: [{ role: 'user', content: prompt }],
        format: "json",
        stream: false
      });
      const rewrittenItem = parseJSONResponse(response.data.message.content);
      console.log('Rewritten item:', JSON.stringify(rewrittenItem, null, 2));
      res.json(rewrittenItem);
    }
  } catch (error) {
    console.error('Error rewriting item:', error);
    res.status(500).json({
      error: 'Failed to rewrite item',
      details: error.message
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});