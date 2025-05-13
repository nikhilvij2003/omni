import { useEffect, useState, useRef } from "react";
import axios from "axios";
import BASE_URL from "../config/api";
import { FiMenu, FiPlus, FiSend, FiSearch } from "react-icons/fi";
import { ImSpinner8 } from "react-icons/im";
import "../styles/global.css";
import LogoutButton from "../components/LogoutButton";
import StackblitzLauncher from "../components/StackblitzLauncher";
import AdvancedEditor from '../components/AdvancedEditor';
import socket from "../config/Socket";


const Chat = () => {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [error, setError] = useState("");
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weatherSearch, setWeatherSearch] = useState("");

  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState("");

  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [htmlForVisualEdit, setHtmlForVisualEdit] = useState('');

  const [htmlContent, setHtmlContent] = useState('');
  const [cssContent, setCssContent] = useState('');
  const [jsContent, setJsContent] = useState('');

  const [streamingResponses, setStreamingResponses] = useState({});

  const fetchNewsByCountry = async (countryCode) => {
    if (!countryCode) return;
    setNewsLoading(true);
    setNewsError("");
    try {
      const response = await axios.get(`${BASE_URL}/api/news`);
      setNewsArticles(response.data.articles);
    } catch (error) {
      setNewsError("Failed to fetch news.");
    } finally {
      setNewsLoading(false);
    }
  };
  useEffect(() => {
    if (weather && weather.sys && weather.sys.country) {
      fetchNewsByCountry(weather.sys.country);
    }
  }, [weather]);



  const fetchWeatherByCoords = async (lat, lon) => {
  setWeatherLoading(true);
  setWeatherError("");
  try {
    const response = await axios.get(
      `${BASE_URL}/api/weather/coords?lat=${lat}&lon=${lon}`
    );
    setWeather(response.data);
  } catch (error) {
    setWeatherError("Failed to fetch weather data.");
  } finally {
    setWeatherLoading(false);
  }
};

  const fetchWeatherByCity = async (city) => {
  if (!city) return;
  setWeatherLoading(true);
  setWeatherError("");
  try {
    const response = await axios.get(
      `${BASE_URL}/api/weather/city?city=${city}`
    );
    setWeather(response.data);
  } catch (error) {
    setWeatherError("City not found.");
  } finally {
    setWeatherLoading(false);
  }
};

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        () => {
          setWeatherError("Geolocation permission denied.");
        }
      );
    } else {
      setWeatherError("Geolocation is not supported by this browser.");
    }
  }, []);




  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchThreads = async () => {
    console.log("Fetching threads..."); // Log the start of the fetch

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/auth/threads`,
        { headers: { Authorization: token } }
      );
      setThreads(response.data);
    } catch (error) {
      console.error("Failed to fetch threads:", error);
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get('token');

    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const initializeChat = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          `${BASE_URL}/api/auth/start-chat`,
          {},
          { headers: { Authorization: token } }
        );
        setCurrentThreadId(response.data.threadId);
      } catch (error) {
        setError("Failed to initialize chat session");
      }
    };



    initializeChat();
    fetchThreads();
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      if (!currentThreadId) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Unauthorized. Please log in again.");

        const response = await axios.get(
          `${BASE_URL}/api/auth/get-history?threadId=${currentThreadId}`,
          { headers: { Authorization: token } }
        );

        setChats(response.data);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch chats.");
      }
    };

    fetchChats();
  }, [currentThreadId]);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const handleNewChat = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/auth/start-chat`,
        { newThread: true },
        { headers: { Authorization: token } }
      );
      setCurrentThreadId(response.data.threadId);
      setChats([]);
    } catch (error) {
      setError("Failed to create new chat");
    }
  };

  const switchThread = async (threadId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.get(
        `${BASE_URL}/api/auth/thread/${threadId}`,
        { headers: { Authorization: token } }
      );
      setCurrentThreadId(threadId);
    } catch (error) {
      setError("Failed to switch chat");
    }
  };


  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);

    // Step 1: Add initial user message with empty bot response
    setChats(prev => [...prev, {
      userMessage: message,
      botResponse: null,
      isStreaming: true
    }]);

    try {
      const token = localStorage.getItem("token");
      let botResponse = "";

      if (message.toLowerCase().includes("show my events")) {
        const response = await axios.get(
          `${BASE_URL}/api/auth/calendar/events`,
          { headers: { Authorization: token } }
        );
        botResponse = response.data.length > 0
          ? response.data.map(event => `📅 ${event.summary} - ${event.start.dateTime}`).join("\n")
          : "No upcoming events found.";

        // ✅ Update last message with bot response
        setChats(prev => {
          const updated = [...prev];
          updated[updated.length - 1].botResponse = botResponse;
          return updated;
        });

      } else if (message.toLowerCase().startsWith("add event")) {
        const eventRegex = /add event (.+) on (\d{4}-\d{2}-\d{2}) from (\d{2}:\d{2}) to (\d{2}:\d{2})/i;
        const match = message.match(eventRegex);

        if (match) {
          const [_, summary, date, startTime, endTime] = match;

          const eventDetails = {
            summary,
            start: { dateTime: `${date}T${startTime}:00Z` },
            end: { dateTime: `${date}T${endTime}:00Z` }
          };

          try {
        const response = await axios.post(
          `${BASE_URL}/api/auth/calendar/event`,
          eventDetails,
          { headers: { Authorization: token } }
        );
            botResponse = `✅ Event '${response.data.summary}' added successfully!, click on link to view: ${response.data.htmlLink}`;
          } catch (err) {
            botResponse = `❌ Failed to add event: ${err.response?.data?.message || err.message}`;
          }
        } else {
          botResponse = `⚠️ Please provide event in format: "add event <title> on YYYY-MM-DD from HH:MM to HH:MM"`;
        }


        setChats(prev => {
          const updated = [...prev];
          updated[updated.length - 1].botResponse = botResponse;
          return updated;
        });

      } else if (message.toLowerCase().includes("delete event")) {
        const eventId = message.split(" ").pop();
        await axios.delete(`${BASE_URL}/api/auth/calendar/event/${eventId}`, {
          headers: { Authorization: token }
        });
        botResponse = "🗑 Event deleted successfully!";

        setChats(prev => {
          const updated = [...prev];
          updated[updated.length - 1].botResponse = botResponse;
          return updated;
        });

      } else {
        // ✅ For streaming, don't update chats here. Let socket handlers do it.
          await axios.post(
            `${BASE_URL}/api/auth/stream-message`,
            { message, threadId: currentThreadId },
            { headers: { Authorization: token } }
          );
      }

      setMessage("");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process request.");
    } finally {
      setIsLoading(false);
    }
  };



  const handleSearch = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/auth/search`,
        { query: message },
        { headers: { Authorization: token } }
      );

      const searchResults = response.data.results;
      let botResponse = "Here are the latest web results:\n\n";

      searchResults.forEach((result, index) => {
        botResponse += `${index + 1}. ${result.title}\n`;
        botResponse += `${result.snippet}\n`;
        botResponse += `🔗 ${result.link}\n\n`;
      });

      setChats([...chats, { userMessage: message, botResponse }]);
      setMessage("");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Search failed");
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    let chunkBuffer = "";
    let debounceTimer = null;

    // Listen for stream chunks from the server
    socket.on("streamChunk", ({ partial, threadId }) => {
      if (threadId === currentThreadId) {
        // Add the incoming chunk to our buffer
        chunkBuffer += partial;

        // If no debounce timer is set, start one
        if (!debounceTimer) {
          debounceTimer = setTimeout(() => {
            // Update the last chat message with the buffered chunk
            setChats(prev => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              if (lastIndex >= 0) {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  // Append the buffered chunk instead of adding every small piece
                  botResponse: (updated[lastIndex].botResponse || "") + chunkBuffer
                };
              }
              return updated;
            });
            // Clear the buffer and reset the timer variable
            chunkBuffer = "";
            debounceTimer = null;
            scrollToBottom();
          }, 2); // Update every 200ms
        }
      }
    });

    // Listen for the final bot response event
    socket.on("botResponse", ({ botResponse, threadId }) => {
      if (threadId === currentThreadId) {
        // If there is any pending buffer, flush it immediately
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
          setChats(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                botResponse: (updated[lastIndex].botResponse || "") + chunkBuffer
              };
            }
            return updated;
          });
          chunkBuffer = "";
        }

        // Append the final botResponse to what we have so far
        setChats(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              botResponse: (updated[lastIndex].botResponse || "") + botResponse,
              isStreaming: false // Mark as not streaming anymore
            };
          }
          return updated;
        });
        setIsLoading(false);
      }
    });

    return () => {
      socket.off("streamChunk");
      socket.off("botResponse");
    };
  }, [currentThreadId]);

  useEffect(() => {
    if (currentThreadId) {
      socket.emit("joinThread", { threadId: currentThreadId });
    }
  }, [currentThreadId]);


  const MessageBubble = ({ isUser, children }) => (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg p-4 transition-all duration-200 ${isUser
            ? 'bg-blue-600 text-white ml-auto hover:bg-blue-700'
            : 'bg-white text-gray-800 shadow-md hover:shadow-lg'
          }`}
      >
        {children}
      </div>
    </div>
  );

  const parseCodeBlocks = (botResponse) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(botResponse))) {
      if (match.index > lastIndex) {
        const textPart = botResponse.slice(lastIndex, match.index);
        blocks.push(...parseTextFormatting(textPart));
      }

      blocks.push({
        type: 'code',
        language: match[1] || 'plaintext',
        code: match[2].trim()
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < botResponse.length) {
      const textPart = botResponse.slice(lastIndex);
      blocks.push(...parseTextFormatting(textPart));
    }

    return blocks;
  };

  const parseTextFormatting = (text) => {
    const formattedBlocks = [];
    const lines = text.split('\n');

    lines.forEach((line) => {
      if (line.startsWith('###')) {
        formattedBlocks.push({
          type: 'header',
          level: 3,
          content: line.replace(/^###\s*/, '')
        });
        return;
      }

      let inlineRegex = /(\*\*(.*?)\*\*|__(.*?)__|~~(.*?)~~|\*(.*?)\*|`(.*?)`)/g;
      let lastIndex = 0;
      let match;

      while ((match = inlineRegex.exec(line))) {
        if (match.index > lastIndex) {
          formattedBlocks.push({
            type: 'text',
            content: line.slice(lastIndex, match.index)
          });
        }

        if (match[2]) {
          formattedBlocks.push({ type: 'bold', content: match[2] });
        } else if (match[3]) {
          formattedBlocks.push({ type: 'underline', content: match[3] });
        } else if (match[4]) {
          formattedBlocks.push({ type: 'strikethrough', content: match[4] });
        } else if (match[5]) {
          formattedBlocks.push({ type: 'italic', content: match[5] });
        } else if (match[6]) {
          formattedBlocks.push({ type: 'inline-code', content: match[6] });
        }

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < line.length) {
        formattedBlocks.push({
          type: 'text',
          content: line.slice(lastIndex)
        });
      }

      formattedBlocks.push({ type: 'newline' });
    });

    return formattedBlocks;
  };


  //*********FOR INLINEEDITOR.JS*********************** */
  const previewProject = (files) => {
    if (!files || files.length === 0) {
      alert("No files to preview");
      return;
    }

    let html = '<div>No HTML content</div>';
    let css = '/* No CSS content */';
    let js = '// No JavaScript content';

    files.forEach(file => {
      switch (file.language.toLowerCase()) {
        case 'html':
          html = file.code || html;
          break;
        case 'css':
          css = file.code || css;
          break;
        case 'javascript':
          js = file.code || js;
          break;
        default:
          break;
      }
    });

    setHtmlContent(html);
    setCssContent(css);
    setJsContent(js);
    setShowAdvancedEditor(true);
  };

  //*******FOR ADVANCED-EDITOR********* */



  useEffect(() => {
    console.log("HTML for editor:", htmlForVisualEdit);
  }, [htmlForVisualEdit]);


  const previewCode = (code, language = 'html') => {
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <html>
        <head>
          <title>Code Preview</title>
          <style>
            body { padding: 20px; font-family: Arial; }
            pre { background: #f4f4f4; padding: 10px; }
          </style>
        </head>
        <body>
          <pre><code>${code}</code></pre>
          ${language === 'html' ? `<div>${code}</div>` : ''}
          ${language === 'javascript' ? `<script>try {${code}} catch(e) {}</script>` : ''}
        </body>
      </html>
    `);
    newWindow.document.close();
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 overflow-hidden">
      {/* Sidebar */}
      <div className={`w-64 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed h-full z-10`}>
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleNewChat}
            className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="text-lg" /> New Chat
          </button>
        </div>
        <div className="p-1 border-b border-gray-100">
          <div className="mt-1">
            <h2 className="text-lg font-semibold mb-2">Weather</h2>
            <input
              type="text"
              value={weatherSearch}
              onChange={(e) => setWeatherSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchWeatherByCity(weatherSearch)}
              placeholder="Search city"
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <button
              onClick={() => fetchWeatherByCity(weatherSearch)}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Search
            </button>

            {weatherLoading && <p className="mt-2">Loading...</p>}
            {weatherError && <p className="mt-2 text-red-600">{weatherError}</p>}

            {weather && (
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold">{weather.name}</h3>
                <p className="text-3xl font-semibold">{Math.round(weather.main.temp)}°C</p>
                <p className="capitalize">{weather.weather[0].description}</p>
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                  alt={weather.weather[0].description}
                  className="mx-auto"
                />
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 p-4 border-t border-gray-200 overflow-y-auto max-h-64">
          <h2 className="text-lg font-semibold mb-2">Top News</h2>
          {newsLoading && <p>Loading news...</p>}
          {newsError && <p className="text-red-600">{newsError}</p>}
          {!newsLoading && !newsError && newsArticles.length === 0 && <p>No news available.</p>}
          <ul className="space-y-2 text-sm">
            {newsArticles.map((article, index) => (
              <li key={index}>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {article.title}
                </a>
              </li>
            ))}
          </ul>
        </div>


        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {threads.map((thread) => (
            <div
              key={thread.threadId}
              className={`p-3 mx-2 my-1 rounded-lg cursor-pointer transition-colors ${currentThreadId === thread.threadId
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-gray-100'
                }`}
              onClick={() => switchThread(thread.threadId)}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="truncate">Chat {thread.lastMessage?.userMessage || "New Chat"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg md:hidden hover:bg-gray-100"
            >
              <FiMenu size={20} />
            </button>
            <h1 className="text-xl font-semibold">Chat Assistant</h1>
            <div className="flex gap-2">
              <LogoutButton className="p-2 text-gray-600 rounded-lg hover:bg-gray-100" />
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {error && (
            <div className="error-message bg-red-100 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {chats.map((chat, idx) => (
            <div key={idx} className="space-y-4">
              <MessageBubble isUser={true}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">You:</span>
                  {chat.userMessage}
                </div>
              </MessageBubble>

              <MessageBubble isUser={false}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-blue-600">
                    <span className="font-semibold">Assistant:</span>
                  </div>
                  {chat.botResponse ? (
                    (() => {
                      const blocks = parseCodeBlocks(chat.botResponse);
                      const projectFiles = blocks.filter(b => b.type === 'code');

                      return (
                        <>
                          {blocks.map((block, i) => {
                            if (block.type === 'text') {
                              return <span key={i}>{block.content}</span>;
                            }

                            else if (block.type === 'code' && block.code.trim() !== '') {
                              return (
                                <div key={i} className="code-block border border-gray-300 rounded-lg mb-2">
                                  <div className="code-header flex justify-between items-center bg-gray-100 p-2 rounded-t-lg">
                                    <span className="language-tag font-bold text-sm uppercase">
                                      {block.language}
                                    </span>
                                    <div className="flex gap-2">
                                      <button
                                        className="copy-btn bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors"
                                        onClick={() => navigator.clipboard.writeText(block.code)}
                                      >
                                        Copy
                                      </button>
                                      <button
                                        className="preview-btn bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600 transition-colors"
                                        onClick={() => previewCode(block.code, block.language)}
                                      >
                                        Preview
                                      </button>
                                    </div>
                                  </div>
                                  <pre className="p-3 text-sm bg-gray-50 rounded-b-lg"><code>{block.code}</code></pre>
                                </div>
                              );
                            }
                            else if (block.type === 'search') {
                              return (
                                <div key={i} className="bg-white border border-gray-300 p-4 rounded-lg shadow text-sm">
                                  <h3 className="text-base font-semibold text-gray-800 mb-2">Search Results for "{block.query}"</h3>
                                  <ul className="space-y-2">
                                    {block.results.map((result, j) => (
                                      <li key={j}>
                                        <a href={result.link} target="result.link" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">
                                          {result.title}
                                        </a>
                                        <p className="text-gray-600 text-xs">{result.snippet}</p>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            }
                            else if (block.type === 'calendar') {
                              return (
                                <div key={i} className="bg-purple-50 border border-purple-300 p-4 rounded-lg shadow text-sm">
                                  <h3 className="text-base font-semibold text-purple-800 mb-2">📅 Upcoming Events</h3>
                                  <ul className="space-y-3">
                                    {block.events.map((event, j) => (
                                      <li key={j} className="bg-white p-3 rounded-lg border border-purple-200">
                                        <div className="font-medium text-purple-700">{event.summary}</div>
                                        <div className="text-xs text-gray-600">
                                          🕒 {new Date(event.start).toLocaleString()} – {new Date(event.end).toLocaleString()}
                                        </div>
                                        {event.location && (
                                          <div className="text-xs text-gray-600">📍 {event.location}</div>
                                        )}
                                        {event.description && (
                                          <div className="text-xs text-gray-500 italic mt-1">{event.description}</div>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            }


                            return null; // 👈 prevent rendering empty or unknown types
                          })}

                          {projectFiles.length > 1 && (
                            <><StackblitzLauncher
                              html={projectFiles.find(f => f.language === "html")?.code || "<div>...</div>"}
                              css={projectFiles.find(f => f.language === "css")?.code || ""}
                              js={projectFiles.find(f => f.language === "javascript")?.code || ""} /><button
                                className="preview-btn bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                                onClick={() => previewProject(projectFiles)}
                              >
                                Preview Full Project
                              </button>
                            </>
                          )}

                        </>
                      );
                    })()
                  ) : (
                    <div className="text-gray-500 italic">
                      {isLoading && idx === chats.length - 1 ? (
                        "Assistant is typing..."
                      ) : (
                        "No response available"
                      )}
                    </div>
                  )}
                </div>
              </MessageBubble>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 p-4 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message or search query..."
                className="w-full px-6 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all duration-200 pr-20 text-lg"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-600"
                  title="Web Search"
                >
                  <FiSearch size={24} />
                </button>
              </div>
            </div>

            <button
              onClick={sendMessage}
              disabled={isLoading}
              className={`px-6 py-4 rounded-xl flex items-center gap-2 transition-all duration-200 ${isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {isLoading ? (
                <ImSpinner8 className="animate-spin text-white text-xl" />
              ) : (
                <>
                  <FiSend size={24} className="text-white" />
                  <span className="text-white font-medium text-lg">Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showAdvancedEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Advanced Editor</h2>
              <button
                onClick={() => setShowAdvancedEditor(false)}
                className="text-red-600 hover:text-red-800 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AdvancedEditor
                html={htmlContent}
                css={cssContent}
                js={jsContent}
                onUpdate={({ html, css, js }) => {
                  setHtmlContent(html);
                  setCssContent(css);
                  setJsContent(js);
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>

  );
};

export default Chat;