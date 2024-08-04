import { useReducer, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Convert from "ansi-to-html";

const convert = new Convert({ newline: true });

const STATES = {
  IDLE: "IDLE",
  GENERATING_KEY: "GENERATING_KEY",
  KEY_GENERATED: "KEY_GENERATED",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  ERROR: "ERROR",
};

const ACTIONS = {
  GENERATE_KEY: "GENERATE_KEY",
  KEY_GENERATED: "KEY_GENERATED",
  CONNECT: "CONNECT",
  CONNECTED: "CONNECTED",
  DISCONNECT: "DISCONNECT",
  SET_ERROR: "SET_ERROR",
  UPDATE_TERMINAL: "UPDATE_TERMINAL",
  UPDATE_INPUT: "UPDATE_INPUT",
  UPDATE_HOST: "UPDATE_HOST",
  UPDATE_USERNAME: "UPDATE_USERNAME",
};

const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.GENERATE_KEY:
      return { ...state, status: STATES.GENERATING_KEY };
    case ACTIONS.KEY_GENERATED:
      return {
        ...state,
        status: STATES.KEY_GENERATED,
        publicKey: action.payload.publicKey,
        sessionId: action.payload.sessionId,
      };
    case ACTIONS.CONNECT:
      return { ...state, status: STATES.CONNECTING };
    case ACTIONS.CONNECTED:
      return { ...state, status: STATES.CONNECTED, prompt: action.payload };
    case ACTIONS.DISCONNECT:
      return { ...state, status: STATES.IDLE, prompt: "", terminalContent: [] };
    case ACTIONS.SET_ERROR:
      return { ...state, status: STATES.ERROR, error: action.payload };
    case ACTIONS.UPDATE_TERMINAL:
      return {
        ...state,
        terminalContent: [...state.terminalContent, action.payload],
      };
    case ACTIONS.UPDATE_INPUT:
      return { ...state, currentInput: action.payload };
    case ACTIONS.UPDATE_HOST:
      return { ...state, host: action.payload };
    case ACTIONS.UPDATE_USERNAME:
      return { ...state, username: action.payload };
    default:
      return state;
  }
};

const initialState = {
  status: STATES.IDLE,
  publicKey: "",
  sessionId: "",
  host: "",
  username: "",
  currentInput: "",
  terminalContent: [],
  prompt: "",
  error: null,
};

const SSHConnection = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef(null);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [state.terminalContent, scrollToBottom]);

  useEffect(() => {
    if (state.sessionId) {
      const newSocket = new WebSocket(`ws://localhost:8000/ws/${state.sessionId}`);

      newSocket.onopen = () => {
        console.log("WebSocket Connected");
        socketRef.current = newSocket;
      };

      newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "prompt") {
          dispatch({ type: ACTIONS.CONNECTED, payload: data.content });
        }
        dispatch({ type: ACTIONS.UPDATE_TERMINAL, payload: data });
      };

      newSocket.onclose = () => {
        console.log("WebSocket Disconnected");
        dispatch({ type: ACTIONS.DISCONNECT });
      };

      return () => {
        newSocket.close();
      };
    }
  }, [state.sessionId]);

  const generateKey = async () => {
    dispatch({ type: ACTIONS.GENERATE_KEY });
    try {
      const response = await axios.post("http://localhost:8000/generate-key");
      dispatch({
        type: ACTIONS.KEY_GENERATED,
        payload: {
          publicKey: response.data.publicKey,
          sessionId: response.data.sessionId,
        },
      });
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: "Error generating key" });
    }
  };

  const connectSSH = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      dispatch({ type: ACTIONS.CONNECT });
      socketRef.current.send(JSON.stringify({ command: "connect", host: state.host, username: state.username }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && state.status === STATES.CONNECTED) {
      e.preventDefault();
      const command = state.currentInput.trim();
      if (command) {
        dispatch({
          type: ACTIONS.UPDATE_TERMINAL,
          payload: { type: "command", content: `${state.prompt}${command}` },
        });
        socketRef.current.send(JSON.stringify({ command: "execute", args: command }));
        dispatch({ type: ACTIONS.UPDATE_INPUT, payload: "" });
      }
    }
  };

  return (
    <div className="h-[100dvh] w-full dark bg-primary flex justify-center items-center">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Terminal className="mr-2" />
            SSH Terminal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={generateKey} className="mb-4" disabled={state.status !== STATES.IDLE}>
            Generate SSH Key
          </Button>
          {state.publicKey && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Public Key:</h2>
              <pre className="p-2 rounded overflow-x-auto text-sm">{state.publicKey}</pre>
            </div>
          )}
          {state.status !== STATES.CONNECTED && (
            <div className="flex space-x-2 mb-4">
              <Input type="text" placeholder="Host" value={state.host} onChange={(e) => dispatch({ type: ACTIONS.UPDATE_HOST, payload: e.target.value })} />
              <Input type="text" placeholder="Username" value={state.username} onChange={(e) => dispatch({ type: ACTIONS.UPDATE_USERNAME, payload: e.target.value })} />
              <Button onClick={connectSSH} disabled={state.status !== STATES.KEY_GENERATED}>
                Connect
              </Button>
            </div>
          )}
          <div ref={terminalRef} className="bg-black text-green-500 p-4 rounded h-96 overflow-y-auto font-mono text-sm" onClick={() => inputRef.current?.focus()}>
            {state.terminalContent.map((line, index) => (
              <div key={index} className={line.type === "error" ? "text-red-500" : ""} dangerouslySetInnerHTML={{ __html: convert.toHtml(line.content) }} />
            ))}
            <div className="flex">
              <span>{state.prompt}</span>
              <input
                ref={inputRef}
                type="text"
                value={state.currentInput}
                onChange={(e) => dispatch({ type: ACTIONS.UPDATE_INPUT, payload: e.target.value })}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none flex-grow ml-1"
                autoFocus
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SSHConnection;
