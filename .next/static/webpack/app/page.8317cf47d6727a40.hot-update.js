"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/page",{

/***/ "(app-pages-browser)/./src/app/page.tsx":
/*!**************************!*\
  !*** ./src/app/page.tsx ***!
  \**************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Home)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _page_module_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./page.module.css */ \"(app-pages-browser)/./src/app/page.module.css\");\n/* harmony import */ var _page_module_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_page_module_css__WEBPACK_IMPORTED_MODULE_2__);\n/* __next_internal_client_entry_do_not_use__ default auto */ \nvar _s = $RefreshSig$();\n\n\nfunction Home() {\n    _s();\n    const [question, setQuestion] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');\n    const [isLoading, setIsLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const [aiResponse, setAiResponse] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');\n    const [audioUrl, setAudioUrl] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');\n    const [isPlaying, setIsPlaying] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const audioRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);\n    // Cleanup function for blob URLs\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)({\n        \"Home.useEffect\": ()=>{\n            return ({\n                \"Home.useEffect\": ()=>{\n                    if (audioUrl) {\n                        URL.revokeObjectURL(audioUrl);\n                    }\n                }\n            })[\"Home.useEffect\"];\n        }\n    }[\"Home.useEffect\"], [\n        audioUrl\n    ]);\n    // Handle audio play/pause events\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)({\n        \"Home.useEffect\": ()=>{\n            const audio = audioRef.current;\n            if (!audio) return;\n            const handlePlay = {\n                \"Home.useEffect.handlePlay\": ()=>setIsPlaying(true)\n            }[\"Home.useEffect.handlePlay\"];\n            const handlePause = {\n                \"Home.useEffect.handlePause\": ()=>setIsPlaying(false)\n            }[\"Home.useEffect.handlePause\"];\n            const handleEnded = {\n                \"Home.useEffect.handleEnded\": ()=>setIsPlaying(false)\n            }[\"Home.useEffect.handleEnded\"];\n            audio.addEventListener('play', handlePlay);\n            audio.addEventListener('pause', handlePause);\n            audio.addEventListener('ended', handleEnded);\n            return ({\n                \"Home.useEffect\": ()=>{\n                    audio.removeEventListener('play', handlePlay);\n                    audio.removeEventListener('pause', handlePause);\n                    audio.removeEventListener('ended', handleEnded);\n                }\n            })[\"Home.useEffect\"];\n        }\n    }[\"Home.useEffect\"], []);\n    const handleSubmit = async (e)=>{\n        e.preventDefault();\n        setIsLoading(true);\n        setAudioUrl('');\n        setIsPlaying(false);\n        try {\n            const response = await fetch('/api/feedback', {\n                method: 'POST',\n                headers: {\n                    'Content-Type': 'application/json'\n                },\n                body: JSON.stringify({\n                    question\n                })\n            });\n            if (!response.ok) {\n                throw new Error('Failed to submit question');\n            }\n            const data = await response.json();\n            // Update AI response text\n            setAiResponse(data.response);\n            // Convert audio data to blob and create URL\n            const audioData = atob(data.audio);\n            const audioArray = new Uint8Array(audioData.length);\n            for(let i = 0; i < audioData.length; i++){\n                audioArray[i] = audioData.charCodeAt(i);\n            }\n            const audioBlob = new Blob([\n                audioArray\n            ], {\n                type: 'audio/mp3'\n            });\n            const url = URL.createObjectURL(audioBlob);\n            // Update audio source and play\n            setAudioUrl(url);\n            if (audioRef.current) {\n                audioRef.current.src = url;\n                audioRef.current.play();\n            }\n            // Reset the form\n            setQuestion('');\n        } catch (error) {\n            console.error('Error submitting question:', error);\n            setAiResponse('An error occurred while processing your request.');\n        } finally{\n            setIsLoading(false);\n        }\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"main\", {\n        className: (_page_module_css__WEBPACK_IMPORTED_MODULE_2___default().main),\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            className: (_page_module_css__WEBPACK_IMPORTED_MODULE_2___default().container),\n            children: [\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h1\", {\n                    className: (_page_module_css__WEBPACK_IMPORTED_MODULE_2___default().title),\n                    children: \"AI Teaching Assistant\"\n                }, void 0, false, {\n                    fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n                    lineNumber: 96,\n                    columnNumber: 9\n                }, this),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: (_page_module_css__WEBPACK_IMPORTED_MODULE_2___default().audioContainer),\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                            className: \"\".concat((_page_module_css__WEBPACK_IMPORTED_MODULE_2___default().speechIcon), \" \").concat(isPlaying ? (_page_module_css__WEBPACK_IMPORTED_MODULE_2___default().speaking) : ''),\n                            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"svg\", {\n                                xmlns: \"http://www.w3.org/2000/svg\",\n                                fill: \"none\",\n                                viewBox: \"0 0 24 24\",\n                                stroke: \"currentColor\",\n                                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"path\", {\n                                    strokeLinecap: \"round\",\n                                    strokeLinejoin: \"round\",\n                                    strokeWidth: 2,\n                                    d: \"M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z\"\n                                }, void 0, false, {\n                                    fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n                                    lineNumber: 106,\n                                    columnNumber: 15\n                                }, this)\n                            }, void 0, false, {\n                                fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n                                lineNumber: 100,\n                                columnNumber: 13\n                            }, this)\n                        }, void 0, false, {\n                            fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n                            lineNumber: 99,\n                            columnNumber: 11\n                        }, this),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"audio\", {\n                            ref: audioRef,\n                            controls: true,\n                            style: {\n                                display: 'none'\n                            }\n                        }, void 0, false, {\n                            fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n                            lineNumber: 114,\n                            columnNumber: 11\n                        }, this)\n                    ]\n                }, void 0, true, {\n                    fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n                    lineNumber: 98,\n                    columnNumber: 9\n                }, this),\n                aiResponse && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: (_page_module_css__WEBPACK_IMPORTED_MODULE_2___default().responseText),\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h2\", {\n                            children: \"Response:\"\n                        }, void 0, false, {\n                            fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n                            lineNumber: 123,\n                            columnNumber: 13\n                        }, this),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"p\", {\n                            children: aiResponse\n                        }, void 0, false, {\n                            fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n                            lineNumber: 124,\n                            columnNumber: 13\n                        }, this)\n                    ]\n                }, void 0, true, {\n                    fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n                    lineNumber: 122,\n                    columnNumber: 11\n                }, this),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"form\", {\n                    onSubmit: handleSubmit,\n                    className: (_page_module_css__WEBPACK_IMPORTED_MODULE_2___default().form),\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"textarea\", {\n                            className: (_page_module_css__WEBPACK_IMPORTED_MODULE_2___default().input),\n                            value: question,\n                            onChange: (e)=>setQuestion(e.target.value),\n                            placeholder: \"Ask a question about your class or homework...\",\n                            rows: 4,\n                            required: true,\n                            disabled: isLoading\n                        }, void 0, false, {\n                            fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n                            lineNumber: 129,\n                            columnNumber: 11\n                        }, this),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                            type: \"submit\",\n                            className: (_page_module_css__WEBPACK_IMPORTED_MODULE_2___default().button),\n                            disabled: isLoading,\n                            children: isLoading ? 'Processing...' : 'Ask Question'\n                        }, void 0, false, {\n                            fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n                            lineNumber: 138,\n                            columnNumber: 11\n                        }, this)\n                    ]\n                }, void 0, true, {\n                    fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n                    lineNumber: 128,\n                    columnNumber: 9\n                }, this)\n            ]\n        }, void 0, true, {\n            fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n            lineNumber: 95,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/Users/laoluog/Documents/TA-Site/src/app/page.tsx\",\n        lineNumber: 94,\n        columnNumber: 5\n    }, this);\n}\n_s(Home, \"UnwB/mJME/7cN2v+i2owDIfCbfI=\");\n_c = Home;\nvar _c;\n$RefreshReg$(_c, \"Home\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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WyIvVXNlcnMvbGFvbHVvZy9Eb2N1bWVudHMvVEEtU2l0ZS9zcmMvYXBwL3BhZ2UudHN4Il0sInNvdXJjZXNDb250ZW50IjpbIid1c2UgY2xpZW50JztcblxuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZVJlZiwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHN0eWxlcyBmcm9tICcuL3BhZ2UubW9kdWxlLmNzcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEhvbWUoKSB7XG4gIGNvbnN0IFtxdWVzdGlvbiwgc2V0UXVlc3Rpb25dID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbaXNMb2FkaW5nLCBzZXRJc0xvYWRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbYWlSZXNwb25zZSwgc2V0QWlSZXNwb25zZV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFthdWRpb1VybCwgc2V0QXVkaW9VcmxdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbaXNQbGF5aW5nLCBzZXRJc1BsYXlpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBhdWRpb1JlZiA9IHVzZVJlZjxIVE1MQXVkaW9FbGVtZW50PihudWxsKTtcblxuICAvLyBDbGVhbnVwIGZ1bmN0aW9uIGZvciBibG9iIFVSTHNcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgaWYgKGF1ZGlvVXJsKSB7XG4gICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwoYXVkaW9VcmwpO1xuICAgICAgfVxuICAgIH07XG4gIH0sIFthdWRpb1VybF0pO1xuXG4gIC8vIEhhbmRsZSBhdWRpbyBwbGF5L3BhdXNlIGV2ZW50c1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGF1ZGlvID0gYXVkaW9SZWYuY3VycmVudDtcbiAgICBpZiAoIWF1ZGlvKSByZXR1cm47XG5cbiAgICBjb25zdCBoYW5kbGVQbGF5ID0gKCkgPT4gc2V0SXNQbGF5aW5nKHRydWUpO1xuICAgIGNvbnN0IGhhbmRsZVBhdXNlID0gKCkgPT4gc2V0SXNQbGF5aW5nKGZhbHNlKTtcbiAgICBjb25zdCBoYW5kbGVFbmRlZCA9ICgpID0+IHNldElzUGxheWluZyhmYWxzZSk7XG5cbiAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKCdwbGF5JywgaGFuZGxlUGxheSk7XG4gICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcigncGF1c2UnLCBoYW5kbGVQYXVzZSk7XG4gICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBoYW5kbGVFbmRlZCk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgYXVkaW8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigncGxheScsIGhhbmRsZVBsYXkpO1xuICAgICAgYXVkaW8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigncGF1c2UnLCBoYW5kbGVQYXVzZSk7XG4gICAgICBhdWRpby5yZW1vdmVFdmVudExpc3RlbmVyKCdlbmRlZCcsIGhhbmRsZUVuZGVkKTtcbiAgICB9O1xuICB9LCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlU3VibWl0ID0gYXN5bmMgKGU6IFJlYWN0LkZvcm1FdmVudCkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBzZXRJc0xvYWRpbmcodHJ1ZSk7XG4gICAgc2V0QXVkaW9VcmwoJycpO1xuICAgIHNldElzUGxheWluZyhmYWxzZSk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnL2FwaS9mZWVkYmFjaycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHF1ZXN0aW9uIH0pLFxuICAgICAgfSk7XG5cbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gc3VibWl0IHF1ZXN0aW9uJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICBcbiAgICAgIC8vIFVwZGF0ZSBBSSByZXNwb25zZSB0ZXh0XG4gICAgICBzZXRBaVJlc3BvbnNlKGRhdGEucmVzcG9uc2UpO1xuXG4gICAgICAvLyBDb252ZXJ0IGF1ZGlvIGRhdGEgdG8gYmxvYiBhbmQgY3JlYXRlIFVSTFxuICAgICAgY29uc3QgYXVkaW9EYXRhID0gYXRvYihkYXRhLmF1ZGlvKTtcbiAgICAgIGNvbnN0IGF1ZGlvQXJyYXkgPSBuZXcgVWludDhBcnJheShhdWRpb0RhdGEubGVuZ3RoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXVkaW9EYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGF1ZGlvQXJyYXlbaV0gPSBhdWRpb0RhdGEuY2hhckNvZGVBdChpKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGF1ZGlvQmxvYiA9IG5ldyBCbG9iKFthdWRpb0FycmF5XSwgeyB0eXBlOiAnYXVkaW8vbXAzJyB9KTtcbiAgICAgIGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYXVkaW9CbG9iKTtcbiAgICAgIFxuICAgICAgLy8gVXBkYXRlIGF1ZGlvIHNvdXJjZSBhbmQgcGxheVxuICAgICAgc2V0QXVkaW9VcmwodXJsKTtcbiAgICAgIGlmIChhdWRpb1JlZi5jdXJyZW50KSB7XG4gICAgICAgIGF1ZGlvUmVmLmN1cnJlbnQuc3JjID0gdXJsO1xuICAgICAgICBhdWRpb1JlZi5jdXJyZW50LnBsYXkoKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVzZXQgdGhlIGZvcm1cbiAgICAgIHNldFF1ZXN0aW9uKCcnKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3VibWl0dGluZyBxdWVzdGlvbjonLCBlcnJvcik7XG4gICAgICBzZXRBaVJlc3BvbnNlKCdBbiBlcnJvciBvY2N1cnJlZCB3aGlsZSBwcm9jZXNzaW5nIHlvdXIgcmVxdWVzdC4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0SXNMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8bWFpbiBjbGFzc05hbWU9e3N0eWxlcy5tYWlufT5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuY29udGFpbmVyfT5cbiAgICAgICAgPGgxIGNsYXNzTmFtZT17c3R5bGVzLnRpdGxlfT5BSSBUZWFjaGluZyBBc3Npc3RhbnQ8L2gxPlxuICAgICAgICBcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5hdWRpb0NvbnRhaW5lcn0+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2Ake3N0eWxlcy5zcGVlY2hJY29ufSAke2lzUGxheWluZyA/IHN0eWxlcy5zcGVha2luZyA6ICcnfWB9PlxuICAgICAgICAgICAgPHN2Z1xuICAgICAgICAgICAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICAgICAgICAgICAgZmlsbD1cIm5vbmVcIlxuICAgICAgICAgICAgICB2aWV3Qm94PVwiMCAwIDI0IDI0XCJcbiAgICAgICAgICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgICAgICAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoPXsyfVxuICAgICAgICAgICAgICAgIGQ9XCJNMTkgMTFhNyA3IDAgMDEtNyA3bTAgMGE3IDcgMCAwMS03LTdtNyA3djRtMCAwSDhtNCAwaDRtLTQtOGEzIDMgMCAwMS0zLTNWNWEzIDMgMCAxMTYgMHY2YTMgMyAwIDAxLTMgM3pcIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGF1ZGlvXG4gICAgICAgICAgICByZWY9e2F1ZGlvUmVmfVxuICAgICAgICAgICAgY29udHJvbHNcbiAgICAgICAgICAgIHN0eWxlPXt7IGRpc3BsYXk6ICdub25lJyB9fVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHthaVJlc3BvbnNlICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnJlc3BvbnNlVGV4dH0+XG4gICAgICAgICAgICA8aDI+UmVzcG9uc2U6PC9oMj5cbiAgICAgICAgICAgIDxwPnthaVJlc3BvbnNlfTwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3VibWl0fSBjbGFzc05hbWU9e3N0eWxlcy5mb3JtfT5cbiAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgIGNsYXNzTmFtZT17c3R5bGVzLmlucHV0fVxuICAgICAgICAgICAgdmFsdWU9e3F1ZXN0aW9ufVxuICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRRdWVzdGlvbihlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkFzayBhIHF1ZXN0aW9uIGFib3V0IHlvdXIgY2xhc3Mgb3IgaG9tZXdvcmsuLi5cIlxuICAgICAgICAgICAgcm93cz17NH1cbiAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICBkaXNhYmxlZD17aXNMb2FkaW5nfVxuICAgICAgICAgIC8+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e3N0eWxlcy5idXR0b259XG4gICAgICAgICAgICBkaXNhYmxlZD17aXNMb2FkaW5nfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHtpc0xvYWRpbmcgPyAnUHJvY2Vzc2luZy4uLicgOiAnQXNrIFF1ZXN0aW9uJ31cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9mb3JtPlxuICAgICAgPC9kaXY+XG4gICAgPC9tYWluPlxuICApO1xufVxuIl0sIm5hbWVzIjpbInVzZVN0YXRlIiwidXNlUmVmIiwidXNlRWZmZWN0Iiwic3R5bGVzIiwiSG9tZSIsInF1ZXN0aW9uIiwic2V0UXVlc3Rpb24iLCJpc0xvYWRpbmciLCJzZXRJc0xvYWRpbmciLCJhaVJlc3BvbnNlIiwic2V0QWlSZXNwb25zZSIsImF1ZGlvVXJsIiwic2V0QXVkaW9VcmwiLCJpc1BsYXlpbmciLCJzZXRJc1BsYXlpbmciLCJhdWRpb1JlZiIsIlVSTCIsInJldm9rZU9iamVjdFVSTCIsImF1ZGlvIiwiY3VycmVudCIsImhhbmRsZVBsYXkiLCJoYW5kbGVQYXVzZSIsImhhbmRsZUVuZGVkIiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJoYW5kbGVTdWJtaXQiLCJlIiwicHJldmVudERlZmF1bHQiLCJyZXNwb25zZSIsImZldGNoIiwibWV0aG9kIiwiaGVhZGVycyIsImJvZHkiLCJKU09OIiwic3RyaW5naWZ5Iiwib2siLCJFcnJvciIsImRhdGEiLCJqc29uIiwiYXVkaW9EYXRhIiwiYXRvYiIsImF1ZGlvQXJyYXkiLCJVaW50OEFycmF5IiwibGVuZ3RoIiwiaSIsImNoYXJDb2RlQXQiLCJhdWRpb0Jsb2IiLCJCbG9iIiwidHlwZSIsInVybCIsImNyZWF0ZU9iamVjdFVSTCIsInNyYyIsInBsYXkiLCJlcnJvciIsImNvbnNvbGUiLCJtYWluIiwiY2xhc3NOYW1lIiwiZGl2IiwiY29udGFpbmVyIiwiaDEiLCJ0aXRsZSIsImF1ZGlvQ29udGFpbmVyIiwic3BlZWNoSWNvbiIsInNwZWFraW5nIiwic3ZnIiwieG1sbnMiLCJmaWxsIiwidmlld0JveCIsInN0cm9rZSIsInBhdGgiLCJzdHJva2VMaW5lY2FwIiwic3Ryb2tlTGluZWpvaW4iLCJzdHJva2VXaWR0aCIsImQiLCJyZWYiLCJjb250cm9scyIsInN0eWxlIiwiZGlzcGxheSIsInJlc3BvbnNlVGV4dCIsImgyIiwicCIsImZvcm0iLCJvblN1Ym1pdCIsInRleHRhcmVhIiwiaW5wdXQiLCJ2YWx1ZSIsIm9uQ2hhbmdlIiwidGFyZ2V0IiwicGxhY2Vob2xkZXIiLCJyb3dzIiwicmVxdWlyZWQiLCJkaXNhYmxlZCIsImJ1dHRvbiJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/app/page.tsx\n"));

/***/ })

});