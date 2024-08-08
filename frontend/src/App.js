import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  AppBar, Toolbar, Typography, TextField, Button, Drawer, List, ListItem,
  ListItemText, Box, Paper, IconButton, Tabs, Tab, Snackbar, CircularProgress
} from '@mui/material';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

import { styled } from '@mui/material/styles';
import {
  Home as HomeIcon,
  CheckBoxOutlineBlank as EpicIcon,
  Assignment as TaskIcon,
  Chat as StoryIcon,
  AccountTree as ArchitectureIcon,
  Code as CodeIcon,
  Send as SendIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import plantumlEncoder from 'plantuml-encoder';

const API_BASE_URL = 'http://localhost:5001';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const LoadingOverlay = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: (theme) => theme.zIndex.drawer + 1,
    }}
  >
    <Box sx={{ textAlign: 'center', color: 'white' }}>
      <CircularProgress size={60} sx={{ color: 'white' }} />
      <Typography variant="h6" sx={{ mt: 2 }}>Processing your Request...</Typography>
    </Box>
  </Box>
);

const PlantUMLRenderer = ({ plantUML, onImageUrlGenerated }) => {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const encoded = plantumlEncoder.encode(plantUML);
    const url = `http://www.plantuml.com/plantuml/png/${encoded}`;
    setImageUrl(url);
    onImageUrlGenerated(url);
  }, [plantUML, onImageUrlGenerated]);

  return (
    <img src={imageUrl} alt="PlantUML Diagram" style={{ maxWidth: '100%', height: 'auto' }} />
  );
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outlined" onClick={handleCopy} size="small" startIcon={copied ? <SaveIcon /> : <SaveIcon />}>
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
};

const App = () => {
  const [input, setInput] = useState('');
  const [epics, setEpics] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stories, setStories] = useState([]);
  const [generatedCode, setGeneratedCode] = useState({});
  const [architecture, setArchitecture] = useState(null);
  const [architectureImageUrl, setArchitectureImageUrl] = useState(null);
  const [fullCode, setFullCode] = useState(null);
  const [error, setError] = useState(null);
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [feedback, setFeedback] = useState({ show: false, type: '', item: null, text: '' });
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
const [pseudocode, setPseudocode] = useState(null);


  useEffect(() => {
    fetchModels();
    fetchProjects();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/models`);
      setModels(response.data.models);
    } catch (error) {
      console.error('Error fetching models:', error);
      setError('Failed to fetch models. Please try again.');
    }
  };

  const fetchProjects = async () => {
    setProjects(['Project 1', 'Project 2', 'Project 3']);
  };

  const generateRequirements = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setEpics([]);
    setTasks([]);
    setStories([]);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/generate-requirements`, {
        params: { idea: input, model }
      });

      const data = response.data;
      setEpics(data.epics || []);
      setTasks(data.tasks || []);
      setStories(data.stories || []);
      setActiveTab(1); // Switch to Epics tab
    } catch (error) {
      console.error('Error generating requirements:', error);
      setError('Failed to generate requirements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = (type, item) => {
    setFeedback({ show: true, type, item, text: '' });
  };

  const submitFeedback = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/rewrite-item`, {
        itemType: feedback.item.type,
        item: feedback.item,
        feedback: feedback.text,
        model
      });
      if (feedback.item.type === 'epic') {
        setEpics(prevEpics =>
          prevEpics.map(e => e.id === feedback.item.id ? response.data : e)
        );
      } else if (feedback.item.type === 'task') {
        setTasks(prevTasks =>
          prevTasks.map(t => t.id === feedback.item.id ? response.data : t)
        );
      } else {
        setStories(prevStories =>
          prevStories.map(s => s.id === feedback.item.id ? response.data : s)
        );
      }
      setFeedback({ show: false, type: '', item: null, text: '' });
    } catch (error) {
      console.error('Error rewriting item:', error);
      setError('Failed to rewrite item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async (story) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/generate-code`, { story, model });
      setGeneratedCode(prevCode => ({
        ...prevCode,
        [story.id]: response.data.code
      }));
    } catch (error) {
      console.error('Error generating code:', error);
      setError('Failed to generate code. Please try again.');
    }
  };

  // const generateArchitecture = async () => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     const response = await axios.post(`${API_BASE_URL}/api/generate-architecture`, { epics, tasks, stories, model });
  //     setArchitecture(response.data.architecture);
  //   } catch (error) {
  //     console.error('Error generating architecture:', error);
  //     setError('Failed to generate architecture. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

    const generateArchitecture = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await axios.post(`${API_BASE_URL}/api/generate-architecture`, { epics, tasks, stories });
    setArchitecture(response.data.architecture);
  } catch (error) {
    console.error('Error generating architecture:', error);
    setError('Failed to generate architecture. Please try again.');
  } finally {
    setLoading(false);
  }
};

    const generatePseudocode = async () => {
  try {
    setLoading(true);
    const response = await axios.post(`${API_BASE_URL}/api/generate-pseudocode`, { epics, tasks, stories });
    setPseudocode(response.data.pseudocode);
  } catch (error) {
    console.error('Error generating pseudocode:', error);
    setError('Failed to generate pseudocode. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const generateFullCode = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/generate-full-code`, { epics, tasks, stories, model });
      setFullCode(response.data.code);
    } catch (error) {
      console.error('Error generating full code:', error);
      setError('Failed to generate full code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitToJira = async (item, itemType) => {
    const projectKey = prompt(`Enter Jira project key for ${itemType}:`);
    if (!projectKey) return;

    try {
      await axios.post(`${API_BASE_URL}/api/submit-to-jira`, {
        projectKey,
        item,
        itemType
      });
      setError(`Successfully submitted ${itemType} to Jira project ${projectKey}`);
    } catch (error) {
      console.error('Error submitting to Jira:', error);
      setError(`Failed to submit ${itemType} to Jira. Please try again.`);
    }
  };

  const renderMarkdown = (content) => (
    <ReactMarkdown
      components={{
        code({node, inline, className, children, ...props}) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          )
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
const renderPseudocode = () => (
  <Box>
    <Typography variant="h5" gutterBottom>Generated Pseudocode</Typography>
    <Button
      variant="contained"
      onClick={generatePseudocode}
      disabled={loading}
      startIcon={<CodeIcon />}
    >
      {loading ? 'Generating...' : 'Generate Pseudocode'}
    </Button>
    {pseudocode && (
      <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
        <SyntaxHighlighter language="plaintext" style={vscDarkPlus}>
          {pseudocode}
        </SyntaxHighlighter>
        <CopyButton text={pseudocode} />
      </Paper>
    )}
  </Box>
);
  const renderEpics = () => (
    <Box>
      <Typography variant="h5" gutterBottom>Epics and Requirements</Typography>
      {epics.map((epic) => (
        <Paper key={epic.id} elevation={3} sx={{ p: 2, my: 2 }}>
          <Typography variant="h6">{epic.summary}</Typography>
          <Typography>{epic.description}</Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => handleFeedback('rewrite', {...epic, type: 'epic'})}
              startIcon={<EditIcon />}
            >
              Rewrite
            </Button>
            <Button variant="outlined" onClick={() => submitToJira(epic, 'epic')} startIcon={<SaveIcon />} sx={{ ml: 1 }}>
              Submit to Jira
            </Button>
          </Box>
        </Paper>
      ))}
    </Box>
  );

  const renderTasks = () => (
    <Box>
      <Typography variant="h5" gutterBottom>Tasks</Typography>
      {tasks.map((task) => (
        <Paper key={task.id} elevation={3} sx={{ p: 2, my: 2 }}>
          <Typography variant="h6">{task.summary}</Typography>
          <Typography>{task.description}</Typography>
          <Typography variant="subtitle2">Acceptance Criteria:</Typography>
          <Typography>{task.acceptanceCriteria}</Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => handleFeedback('rewrite', {...task, type: 'task'})}
              startIcon={<EditIcon />}
            >
              Rewrite
            </Button>
            <Button variant="outlined" onClick={() => submitToJira(task, 'task')} startIcon={<SaveIcon />} sx={{ ml: 1 }}>
              Submit to Jira
            </Button>
          </Box>
        </Paper>
      ))}
    </Box>
  );

  const renderUserStories = () => (
    <Box>
      <Typography variant="h5" gutterBottom>User Stories</Typography>
      {stories.map((story) => (
        <Paper key={story.id} elevation={3} sx={{ p: 2, my: 2 }}>
          <Typography variant="h6">{story.summary}</Typography>
          <Typography>{story.description}</Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => handleFeedback('rewrite', {...story, type: 'story'})}
              startIcon={<EditIcon />}
            >
              Rewrite
            </Button>
            <Button variant="outlined" onClick={() => submitToJira(story, 'story')} startIcon={<SaveIcon />} sx={{ ml: 1 }}>
              Submit to Jira
            </Button>
            <Button variant="contained" onClick={() => generateCode(story)} startIcon={<CodeIcon />} sx={{ ml: 1 }}>
              Generate Code
            </Button>
          </Box>
          {generatedCode[story.id] && (
            <Box sx={{ mt: 2 }}>
              <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
                {generatedCode[story.id]}
              </SyntaxHighlighter>
              <CopyButton text={generatedCode[story.id]} />
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );

  const downloadArchitecture = () => {
    if (architectureImageUrl) {
      fetch(architectureImageUrl)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = 'architecture.png';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
       })
        .catch(() => setError('Failed to download architecture. Please try again.'));
    }
  };

 const renderArchitecture = () => (
    <Box>
      <Typography variant="h5" gutterBottom>Architecture</Typography>
      <Button
        variant="contained"
        onClick={generateArchitecture}
        disabled={loading}
        startIcon={<ArchitectureIcon />}
      >
        {loading ? 'Generating...' : 'Generate Architecture'}
      </Button>
      {architecture && (
        <Box sx={{ mt: 2 }}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <TransformWrapper
              initialScale={1}
              initialPositionX={0}
              initialPositionY={0}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Button onClick={() => zoomIn()}>Zoom In</Button>
                    <Button onClick={() => zoomOut()}>Zoom Out</Button>
                    <Button onClick={() => resetTransform()}>Reset</Button>
                    <Button startIcon={<DownloadIcon />} onClick={downloadArchitecture}>Download</Button>
                  </Box>
                  <TransformComponent>
                    <PlantUMLRenderer
                      plantUML={architecture}
                      onImageUrlGenerated={setArchitectureImageUrl}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </Paper>
        </Box>
      )}
    </Box>
  );

  const renderFullCode = () => (
    <Box>
      <Typography variant="h5" gutterBottom>Generated Code</Typography>
      <Button
        variant="contained"
        onClick={generateFullCode}
        disabled={loading}
        startIcon={<CodeIcon />}
      >
        {loading ? 'Generating...' : 'Generate Full Code'}
      </Button>
      {fullCode && (
        <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
          <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
            {fullCode}
          </SyntaxHighlighter>
          <CopyButton text={fullCode} />
        </Paper>
      )}
    </Box>
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {loading && <LoadingOverlay />}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            InceptiCraft (Beta)
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={drawerOpen}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {projects.map((project, index) => (
              <ListItem button key={project} onClick={() => setSelectedProject(project)}>
                <ListItemText primary={project} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Main open={drawerOpen}>
        <Toolbar />
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="project tabs">
          <Tab icon={<HomeIcon />} label="Home" />
          <Tab icon={<EpicIcon />} label="Epics" />
          <Tab icon={<TaskIcon />} label="Tasks" />
          <Tab icon={<StoryIcon />} label="User Stories" />
          <Tab icon={<ArchitectureIcon />} label="Architecture" />
          <Tab icon={<CodeIcon />} label="Generate PseudoCode" />
        </Tabs>
        <Box sx={{ mt: 2, mb: 10 }}>
          {activeTab === 0 && <Typography>Welcome to InceptiCraft</Typography>}
          {activeTab === 1 && renderEpics()}
          {activeTab === 2 && renderTasks()}
          {activeTab === 3 && renderUserStories()}
          {activeTab === 4 && renderArchitecture()}
          {/*{activeTab === 5 && renderFullCode()}*/}
            {activeTab === 5 && renderPseudocode()}
        </Box>
      </Main>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: drawerWidth,
          right: 0,
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: (theme) => theme.zIndex.drawer + 2,
        }}
      >
        <FormControl variant="outlined" sx={{ width: '200px', mr: 2 }}>
          <InputLabel id="model-select-label">Model</InputLabel>
          <Select
            labelId="model-select-label"
            id="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            label="Model"
          >
            {models.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && generateRequirements()}
          placeholder="Enter your project idea here..."
          variant="outlined"
          disabled={loading}
          sx={{ flexGrow: 1, mr: 2 }}
        />
        <Button
          variant="contained"
          onClick={generateRequirements}
          disabled={loading}
          endIcon={<SendIcon />}
        >
          {loading ? 'Generating...' : 'Generate'}
        </Button>
      </Paper>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        message={error}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => setError(null)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      {feedback.show && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: 3,
            width: '400px',
            zIndex: (theme) => theme.zIndex.drawer + 3,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Rewrite {feedback.item.type === 'epic' ? 'Epic' : feedback.item.type === 'task' ? 'Task' : 'User Story'}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={feedback.text}
            onChange={(e) => setFeedback({ ...feedback, text: e.target.value })}
            placeholder="Provide feedback for rewriting"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={submitFeedback} disabled={loading} variant="contained" sx={{ mr: 1 }}>
              Rewrite
            </Button>
            <Button
              onClick={() => setFeedback({ show: false, type: '', item: null, text: '' })}
              variant="outlined"
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default App;