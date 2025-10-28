import { useState, useEffect } from "react";
import { Button, StandardModal, ActionRow, Form, Spinner, Alert } from "@openedx/paragon";
import ReactMarkdown from "react-markdown";
import { getConfig } from "@edx/frontend-platform";

// Utility function to get CSRF token from cookies
// const getCsrfToken = () => {
//   const name = 'csrftoken';
//   let cookieValue = null;
//   if (document.cookie && document.cookie !== '') {
//     const cookies = document.cookie.split(';');
//     for (let i = 0; i < cookies.length; i++) {
//       const cookie = cookies[i].trim();
//       if (cookie.substring(0, name.length + 1) === (name + '=')) {
//         cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//         break;
//       }
//     }
//   }
//   return cookieValue;
// };

export const GenerateCourseWithAI = ({
  org = "test",
  course = "Cs01",
  run = "2022",
  baseURL = getConfig().LMS_BASE_URL,
  csrfToken,
}) => {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [instruction, setInstruction] = useState("");
  const [outline, setOutline] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch available models from backend
  useEffect(() => {
    if (open) {
      fetchAvailableModels();
    }
  }, [open]);

  const fetchAvailableModels = async () => {
    setLoadingModels(true);
    setError("");
    try {
      const response = await fetch(`${baseURL}/ai-management/api/v1/models/available/`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setModels(data);

      // Set first model as default if available
      if (data.length > 0) {
        setSelectedModel(data[0].id);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch available models");
    } finally {
      setLoadingModels(false);
    }
  };

  const resetForm = () => {
    setSelectedModel(models.length > 0 ? models[0].id : "");
    setInstruction("");
    setOutline("");
    setError("");
    setSuccess(false);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedModel) {
      setError("Please select a model");
      return;
    }

    if (!instruction.trim()) {
      setError("Please fill in instruction");
      return;
    }

    setLoading(true);
    setError("");
    setOutline("");
    setSuccess(false);

    try {
      // Prepare the prompt for course generation
      const promptContent = `Create a detailed course content based on this instruction: ${instruction}.
Please be rigid and make sure that the result are using JSON format below:

[
  {
    "title": "title of the section",
    "subsections": [
      {
        "title": "title of the subsection 1",
        "units": [
          {
            "title": "title of the unit 1",
            "content_title": "title of the content",
            "content": "detailed content"
          },
          {
            "title": "title of the unit 2",
            "content_title": "title of the content",
            "content": "detailed content"
          }
        ]
      }
    ]
  }
]`;

      // Step 1: Generate outline using backend AI API
      const generateResponse = await fetch(`${baseURL}/ai-management/api/v1/generate/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptContent,
          model_id: selectedModel,
          context: {
            org,
            course,
            run
          }
        })
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error("Generate API Error Response:", errorText);
        throw new Error(`Generation failed: ${generateResponse.status} ${generateResponse.statusText}`);
      }

      const generateData = await generateResponse.json();
      const generatedOutline = generateData.response || generateData.content || generateData.text || "";
      setOutline(generatedOutline);

      // Step 2: Parse the outline and create course data
      let parsedOutline;
      try {
        // 1. Remove Markdown code fences if present
        let cleanText = generatedOutline
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        // 2. Extract JSON array from the text
        const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : cleanText;

        // 3. Parse into JS object
        parsedOutline = JSON.parse(jsonString);

        console.log("Parsed outline:", parsedOutline);
      } catch (err) {
        console.error("Failed to parse outline JSON:", err);
        throw new Error("Failed to parse the generated outline. Please try again.");
      }

      // Step 3: Prepare course data in the required format
      const courseData = {
        org,
        course,
        run,
        sections: parsedOutline
      };

      // Step 4: Make POST request to generate course
      const courseResponse = await fetch(`${baseURL}/api/tutor_course_helper/generate-course/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "X-CSRFToken": token }),
        },
        body: JSON.stringify(courseData)
      });

      if (!courseResponse.ok) {
        throw new Error(`Course generation failed: ${courseResponse.status} ${courseResponse.statusText}`);
      }

      await courseResponse.json();
      setSuccess(true);

    } catch (err) {
      setError(err.message || "Failed to generate course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline-primary" onClick={() => setOpen(true)}>
        Generate Course With AI
      </Button>
      <StandardModal
        title="Generate Course With AI"
        isOpen={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        footerNode={
          loading ? null : success ? (
            <ActionRow>
              <ActionRow.Spacer />
              <Button variant="tertiary" onClick={resetForm}>Generate Another</Button>
              <Button onClick={() => {
                setOpen(false);
                resetForm();
                window.location.reload();
              }}>Close</Button>
            </ActionRow>
          ) : (
            <ActionRow>
              <ActionRow.Spacer />
              <Button variant="tertiary" onClick={() => {
                setOpen(false);
                resetForm();
              }}>Cancel</Button>
              <Button onClick={handleSubmit}>Submit</Button>
            </ActionRow>
          )
        }
        isOverflowVisible={false}
      >
        {loadingModels ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Spinner animation="border" size="lg" />
            <p style={{ marginTop: '20px', fontSize: '16px', textAlign: 'center' }}>
              Loading available models...
            </p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Spinner animation="border" size="lg" />
            <p style={{ marginTop: '20px', fontSize: '16px', textAlign: 'center' }}>
              Generating course outline with AI...
            </p>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Alert variant="success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textAlign: 'center' }}>
              <svg fill="#28a745" xmlns="http://www.w3.org/2000/svg"
                   width="100px" height="100px" viewBox="0 0 52 52" enableBackground="new 0 0 52 52" xmlSpace="preserve">
                <path d="M26,2C12.7,2,2,12.7,2,26s10.7,24,24,24s24-10.7,24-24S39.3,2,26,2z M39.4,20L24.1,35.5
                    c-0.6,0.6-1.6,0.6-2.2,0L13.5,27c-0.6-0.6-0.6-1.6,0-2.2l2.2-2.2c0.6-0.6,1.6-0.6,2.2,0l4.4,4.5c0.4,0.4,1.1,0.4,1.5,0L35,15.5
                    c0.6-0.6,1.6-0.6,2.2,0l2.2,2.2C40.1,18.3,40.1,19.3,39.4,20z"/>
              </svg>
              <p style={{marginTop: '10px', textAlign: 'center'}}>Your outline was generated successfully</p>
            </Alert>
            {outline && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'left' }}>
                <h5>Generated Course Outline:</h5>
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#333'
                }}>
                  <ReactMarkdown
                    components={{
                      h1: ({children}) => <h1 style={{color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '8px'}}>{children}</h1>,
                      h2: ({children}) => <h2 style={{color: '#34495e', marginTop: '20px'}}>{children}</h2>,
                      h3: ({children}) => <h3 style={{color: '#7f8c8d', marginTop: '15px'}}>{children}</h3>,
                      strong: ({children}) => <strong style={{color: '#2c3e50'}}>{children}</strong>,
                      code: ({children}) => <code style={{backgroundColor: '#ecf0f1', padding: '2px 4px', borderRadius: '3px', fontFamily: 'monospace'}}>{children}</code>,
                      ul: ({children}) => <ul style={{margin: '10px 0', paddingLeft: '20px'}}>{children}</ul>,
                      ol: ({children}) => <ol style={{margin: '10px 0', paddingLeft: '20px'}}>{children}</ol>,
                      li: ({children}) => <li style={{margin: '5px 0'}}>{children}</li>,
                      p: ({children}) => <p style={{margin: '10px 0'}}>{children}</p>
                    }}
                  >
                    {outline}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Form>
            {/* AI Model Selection */}
            <Form.Group className="mb-3">
              <Form.Label>
                AI Model
              </Form.Label>
              <Form.Control
                as="select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={models.length === 0}
              >
                {models.length === 0 ? (
                  <option value="">No models available</option>
                ) : (
                  models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name || model.id} {model.provider ? `(${model.provider})` : ''}
                    </option>
                  ))
                )}
              </Form.Control>
              <Form.Text className="text-muted">
                Select the AI model to generate your course outline
              </Form.Text>
            </Form.Group>

            {/* Instruction Input */}
            <Form.Group className="mb-3">
              <Form.Label>
                Instruction
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Enter your instruction here..."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
              <Form.Text className="text-muted">
                Describe the course you want to generate
              </Form.Text>
            </Form.Group>

            {error && (
              <Alert variant="danger" style={{ marginTop: '10px', marginLeft:'-10px'}}>
                <div className="d-flex" style={{ gap: '10px' }}>
                    <svg fill="#ff0000ff" width="50px" height="50px" viewBox="0 0 24 24"
                        version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.171 15.398l-5.912-9.854c-.776-1.293-1.963-2.033-3.259-2.033s-2.483.74-3.259
                        2.031l-5.912 9.856c-.786 1.309-.872 2.705-.235 3.83.636 1.126 1.878 1.772 3.406 1.772h12c1.528
                        0 2.77-.646 3.406-1.771.637-1.125.551-2.521-.235-3.831zm-9.171 2.151c-.854 0-1.55-.695-1.55-1.549
                        0-.855.695-1.551 1.55-1.551s1.55.696 1.55 1.551c0 .854-.696 1.549-1.55 1.549zm1.633-7.424c-.011.031-1.401
                        3.468-1.401 3.468-.038.094-.13.156-.231.156s-.193-.062-.231-.156l-1.391-3.438c-.09-.233-.129-.443-.129-.655 0-.965.785-1.75
                        1.75-1.75s1.75.785 1.75 1.75c0 .212-.039.422-.117.625z"/>
                    </svg>
                    <p>{error}</p>
                </div>
              </Alert>
            )}
          </Form>
        )}
      </StandardModal>
    </>
  );
};
