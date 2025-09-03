'use strict';

var React = require('react');
var paragon = require('@openedx/paragon');
var ReactMarkdown = require('react-markdown');
var frontendPlatform = require('@edx/frontend-platform');

const GenerateCourseButton = ({
  secretKey = "",
  org = "test",
  course = "Cs01",
  run = "2022"
}) => {
  const [open, setOpen] = React.useState(false);
  const [instruction, setInstruction] = React.useState("");
  const [outline, setOutline] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const resetForm = () => {
    setInstruction("");
    setOutline("");
    setError("");
    setSuccess(false);
    setLoading(false);
  };
  const handleSubmit = async () => {
    if (!secretKey.trim() || !instruction.trim()) {
      setError("Please provide secret key and fill in instruction");
      return;
    }
    setLoading(true);
    setError("");
    setOutline("");
    setSuccess(false);
    try {
      // Step 1: Generate outline using DeepSeek API
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{
            role: "system",
            content: "You are a helpful assistant that generates detailed course outlines based on user instructions."
          }, {
            role: "user",
            content: `Create a detailed course content based on this instruction: ${instruction}. 
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
              ]
              
              `
          }],
          max_tokens: 1000,
          temperature: 0.7
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const responseText = await response.text();
      console.log("Raw API Response:", responseText);
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from API: ${parseError.message}`);
      }
      const generatedOutline = data.choices[0].message.content;
      setOutline(generatedOutline);

      // Step 2: Parse the outline and create course data
      let parsedOutline;
      try {
        // 1. Remove Markdown code fences if present
        let cleanText = generatedOutline.replace(/```json/g, "").replace(/```/g, "").trim();

        // 2. Extract JSON array from the text
        const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : cleanText;

        // 3. Parse into JS object
        parsedOutline = JSON.parse(jsonString);
        console.log("Parsed outline:", parsedOutline);
      } catch (err) {
        console.error("Failed to parse outline JSON:", err);
      }

      // Step 3: Prepare course data in the required format
      const courseData = {
        org,
        course,
        run,
        sections: parsedOutline
      };

      // Step 4: Make POST request to generate course
      const courseResponse = await fetch(`${frontendPlatform.getConfig().LMS_BASE_URL}/api/tutor_course_helper/generate-course/`, {
        method: "POST",
        credentials: "include",
        // Include cookies for authentication
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(courseData)
      });
      if (!courseResponse.ok) {
        throw new Error(`Course generation failed: ${courseResponse.status} ${courseResponse.statusText}`);
      }
      const courseResult = await courseResponse.json();
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to generate outline");
    } finally {
      setLoading(false);
    }
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(paragon.Button, {
    variant: "outline-primary",
    onClick: () => setOpen(true)
  }, "Generate Course With AI"), /*#__PURE__*/React.createElement(paragon.StandardModal, {
    title: "Generate Course With AI",
    isOpen: open,
    onClose: () => {
      setOpen(false);
      resetForm();
    },
    footerNode: loading ? null : success ? /*#__PURE__*/React.createElement(paragon.ActionRow, null, /*#__PURE__*/React.createElement(paragon.ActionRow.Spacer, null), /*#__PURE__*/React.createElement(paragon.Button, {
      variant: "tertiary",
      onClick: resetForm
    }, "Generate Another"), /*#__PURE__*/React.createElement(paragon.Button, {
      onClick: () => {
        setOpen(false);
        resetForm();
        window.location.reload();
      }
    }, "Close")) : /*#__PURE__*/React.createElement(paragon.ActionRow, null, /*#__PURE__*/React.createElement(paragon.ActionRow.Spacer, null), /*#__PURE__*/React.createElement(paragon.Button, {
      variant: "tertiary",
      onClick: () => {
        setOpen(false);
        resetForm();
      }
    }, "Cancel"), /*#__PURE__*/React.createElement(paragon.Button, {
      onClick: handleSubmit
    }, "Submit")),
    isOverflowVisible: false
  }, loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '40px 20px'
    }
  }, /*#__PURE__*/React.createElement(paragon.Spinner, {
    animation: "border",
    size: "lg"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: '20px',
      fontSize: '16px',
      textAlign: 'center'
    }
  }, "Please wait for a moment.")) : success ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '40px 20px'
    }
  }, /*#__PURE__*/React.createElement(paragon.Alert, {
    variant: "success",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    fill: "#28a745",
    xmlns: "http://www.w3.org/2000/svg",
    width: "100px",
    height: "100px",
    viewBox: "0 0 52 52",
    enableBackground: "new 0 0 52 52",
    xmlSpace: "preserve"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M26,2C12.7,2,2,12.7,2,26s10.7,24,24,24s24-10.7,24-24S39.3,2,26,2z M39.4,20L24.1,35.5 c-0.6,0.6-1.6,0.6-2.2,0L13.5,27c-0.6-0.6-0.6-1.6,0-2.2l2.2-2.2c0.6-0.6,1.6-0.6,2.2,0l4.4,4.5c0.4,0.4,1.1,0.4,1.5,0L35,15.5 c0.6-0.6,1.6-0.6,2.2,0l2.2,2.2C40.1,18.3,40.1,19.3,39.4,20z"
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: '10px',
      textAlign: 'center'
    }
  }, "Your outline was generated successfully")), outline && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '5px',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("h5", null, "Generated Course Outline:"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '14px',
      lineHeight: '1.6',
      color: '#333'
    }
  }, /*#__PURE__*/React.createElement(ReactMarkdown, {
    components: {
      h1: ({
        children
      }) => /*#__PURE__*/React.createElement("h1", {
        style: {
          color: '#2c3e50',
          borderBottom: '2px solid #3498db',
          paddingBottom: '8px'
        }
      }, children),
      h2: ({
        children
      }) => /*#__PURE__*/React.createElement("h2", {
        style: {
          color: '#34495e',
          marginTop: '20px'
        }
      }, children),
      h3: ({
        children
      }) => /*#__PURE__*/React.createElement("h3", {
        style: {
          color: '#7f8c8d',
          marginTop: '15px'
        }
      }, children),
      strong: ({
        children
      }) => /*#__PURE__*/React.createElement("strong", {
        style: {
          color: '#2c3e50'
        }
      }, children),
      code: ({
        children
      }) => /*#__PURE__*/React.createElement("code", {
        style: {
          backgroundColor: '#ecf0f1',
          padding: '2px 4px',
          borderRadius: '3px',
          fontFamily: 'monospace'
        }
      }, children),
      ul: ({
        children
      }) => /*#__PURE__*/React.createElement("ul", {
        style: {
          margin: '10px 0',
          paddingLeft: '20px'
        }
      }, children),
      ol: ({
        children
      }) => /*#__PURE__*/React.createElement("ol", {
        style: {
          margin: '10px 0',
          paddingLeft: '20px'
        }
      }, children),
      li: ({
        children
      }) => /*#__PURE__*/React.createElement("li", {
        style: {
          margin: '5px 0'
        }
      }, children),
      p: ({
        children
      }) => /*#__PURE__*/React.createElement("p", {
        style: {
          margin: '10px 0'
        }
      }, children)
    }
  }, outline)))) : /*#__PURE__*/React.createElement(paragon.Form, null, /*#__PURE__*/React.createElement(paragon.Form.Label, null, "Instruksi"), /*#__PURE__*/React.createElement(paragon.Form.Control, {
    as: "textarea",
    rows: 5,
    placeholder: "Masukkan instruksi Anda di sini...",
    value: instruction,
    onChange: e => setInstruction(e.target.value)
  }), error && /*#__PURE__*/React.createElement(paragon.Alert, {
    variant: "danger",
    style: {
      marginTop: '10px',
      marginLeft: '-10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex",
    style: {
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    fill: "#ff0000ff",
    width: "50px",
    height: "50px",
    viewBox: "0 0 24 24",
    version: "1.2",
    baseProfile: "tiny",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21.171 15.398l-5.912-9.854c-.776-1.293-1.963-2.033-3.259-2.033s-2.483.74-3.259  2.031l-5.912 9.856c-.786 1.309-.872 2.705-.235 3.83.636 1.126 1.878 1.772 3.406 1.772h12c1.528  0 2.77-.646 3.406-1.771.637-1.125.551-2.521-.235-3.831zm-9.171 2.151c-.854 0-1.55-.695-1.55-1.549  0-.855.695-1.551 1.55-1.551s1.55.696 1.55 1.551c0 .854-.696 1.549-1.55 1.549zm1.633-7.424c-.011.031-1.401  3.468-1.401 3.468-.038.094-.13.156-.231.156s-.193-.062-.231-.156l-1.391-3.438c-.09-.233-.129-.443-.129-.655 0-.965.785-1.75  1.75-1.75s1.75.785 1.75 1.75c0 .212-.039.422-.117.625z"
  })), /*#__PURE__*/React.createElement("p", null, error))))));
};

exports.GenerateCourseButton = GenerateCourseButton;
