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

/***/ "(app-pages-browser)/./src/app/components/Student.tsx":
/*!****************************************!*\
  !*** ./src/app/components/Student.tsx ***!
  \****************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Student)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../styles/Student.module.css */ \"(app-pages-browser)/./src/app/styles/Student.module.css\");\n/* harmony import */ var _styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2__);\n/* __next_internal_client_entry_do_not_use__ default auto */ \nvar _s = $RefreshSig$();\n\n\nfunction Student(param) {\n    let { questions, setQuestions } = param;\n    _s();\n    const [question, setQuestion] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');\n    const [isLoading, setIsLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const [aiResponse, setAiResponse] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');\n    const [displayedResponse, setDisplayedResponse] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');\n    const [audioUrl, setAudioUrl] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');\n    const [isPlaying, setIsPlaying] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const [subject, setSubject] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('Computer Science');\n    const [teacher, setTeacher] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('Dr. Smith');\n    const audioRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);\n    const typingSpeed = 30; // ms per character\n    // Cleanup function for blob URLs\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)({\n        \"Student.useEffect\": ()=>{\n            return ({\n                \"Student.useEffect\": ()=>{\n                    if (audioUrl) {\n                        URL.revokeObjectURL(audioUrl);\n                    }\n                }\n            })[\"Student.useEffect\"];\n        }\n    }[\"Student.useEffect\"], [\n        audioUrl\n    ]);\n    // Handle audio play/pause events\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)({\n        \"Student.useEffect\": ()=>{\n            const audio = audioRef.current;\n            if (!audio) return;\n            const handlePlay = {\n                \"Student.useEffect.handlePlay\": ()=>setIsPlaying(true)\n            }[\"Student.useEffect.handlePlay\"];\n            const handlePause = {\n                \"Student.useEffect.handlePause\": ()=>setIsPlaying(false)\n            }[\"Student.useEffect.handlePause\"];\n            const handleEnded = {\n                \"Student.useEffect.handleEnded\": ()=>setIsPlaying(false)\n            }[\"Student.useEffect.handleEnded\"];\n            audio.addEventListener('play', handlePlay);\n            audio.addEventListener('pause', handlePause);\n            audio.addEventListener('ended', handleEnded);\n            return ({\n                \"Student.useEffect\": ()=>{\n                    audio.removeEventListener('play', handlePlay);\n                    audio.removeEventListener('pause', handlePause);\n                    audio.removeEventListener('ended', handleEnded);\n                }\n            })[\"Student.useEffect\"];\n        }\n    }[\"Student.useEffect\"], []);\n    const handleSubmit = async (e)=>{\n        e.preventDefault();\n        setIsLoading(true);\n        setAudioUrl('');\n        setIsPlaying(false);\n        try {\n            const response = await fetch('http://127.0.0.1:5000/feedback', {\n                method: 'POST',\n                headers: {\n                    'Content-Type': 'application/json'\n                },\n                body: JSON.stringify({\n                    question\n                })\n            });\n            if (!response.ok) {\n                throw new Error(\"HTTP error! status: \".concat(response.status));\n            }\n            const data = await response.json();\n            if (!data.response || !data.audio) {\n                throw new Error('Invalid response format from server');\n            }\n            setAiResponse(data.response);\n            typeResponse(data.response);\n            if (data.subject) setSubject(data.subject);\n            if (data.teacher) setTeacher(data.teacher);\n            const audioData = atob(data.audio);\n            const audioArray = new Uint8Array(audioData.length);\n            for(let i = 0; i < audioData.length; i++){\n                audioArray[i] = audioData.charCodeAt(i);\n            }\n            const audioBlob = new Blob([\n                audioArray\n            ], {\n                type: 'audio/mp3'\n            });\n            const url = URL.createObjectURL(audioBlob);\n            setAudioUrl(url);\n            if (audioRef.current) {\n                audioRef.current.src = url;\n                audioRef.current.play();\n            }\n            setQuestion('');\n        } catch (error) {\n            console.error('Error submitting question:', error);\n            setAiResponse(error instanceof Error ? error.message : 'An error occurred while processing your request.');\n        } finally{\n            setIsLoading(false);\n        }\n    };\n    const typeResponse = (text)=>{\n        let currentIndex = 0;\n        setDisplayedResponse('');\n        const typingInterval = setInterval(()=>{\n            if (currentIndex < text.length) {\n                setDisplayedResponse((prev)=>prev + text[currentIndex]);\n                currentIndex++;\n            } else {\n                clearInterval(typingInterval);\n            }\n        }, typingSpeed);\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        className: (_styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2___default().container),\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: (_styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2___default().classInfo),\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"span\", {\n                        children: [\n                            \"Subject: \",\n                            subject\n                        ]\n                    }, void 0, true, {\n                        fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                        lineNumber: 118,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"span\", {\n                        children: [\n                            \"Teacher: \",\n                            teacher\n                        ]\n                    }, void 0, true, {\n                        fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                        lineNumber: 119,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                lineNumber: 117,\n                columnNumber: 7\n            }, this),\n            aiResponse && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: (_styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2___default().responseContainer),\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"p\", {\n                    className: (_styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2___default().typingText),\n                    children: [\n                        displayedResponse,\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"span\", {\n                            className: (_styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2___default().typingCursor)\n                        }, void 0, false, {\n                            fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                            lineNumber: 126,\n                            columnNumber: 13\n                        }, this)\n                    ]\n                }, void 0, true, {\n                    fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                    lineNumber: 124,\n                    columnNumber: 11\n                }, this)\n            }, void 0, false, {\n                fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                lineNumber: 123,\n                columnNumber: 9\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: (_styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2___default().audioContainer),\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                        className: \"\".concat((_styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2___default().speechIcon), \" \").concat(isPlaying ? (_styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2___default().speaking) : ''),\n                        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"svg\", {\n                            xmlns: \"http://www.w3.org/2000/svg\",\n                            fill: \"none\",\n                            viewBox: \"0 0 24 24\",\n                            stroke: \"currentColor\",\n                            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"path\", {\n                                strokeLinecap: \"round\",\n                                strokeLinejoin: \"round\",\n                                strokeWidth: 2,\n                                d: \"M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z\"\n                            }, void 0, false, {\n                                fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                                lineNumber: 139,\n                                columnNumber: 13\n                            }, this)\n                        }, void 0, false, {\n                            fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                            lineNumber: 133,\n                            columnNumber: 11\n                        }, this)\n                    }, void 0, false, {\n                        fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                        lineNumber: 132,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"audio\", {\n                        ref: audioRef,\n                        controls: true,\n                        style: {\n                            display: 'none'\n                        }\n                    }, void 0, false, {\n                        fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                        lineNumber: 147,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                lineNumber: 131,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"form\", {\n                onSubmit: handleSubmit,\n                className: (_styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2___default().form),\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"textarea\", {\n                        className: (_styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2___default().input),\n                        value: question,\n                        onChange: (e)=>setQuestion(e.target.value),\n                        placeholder: \"Ask a question about your class or homework...\",\n                        rows: 4,\n                        required: true,\n                        disabled: isLoading\n                    }, void 0, false, {\n                        fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                        lineNumber: 155,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                        type: \"submit\",\n                        className: (_styles_Student_module_css__WEBPACK_IMPORTED_MODULE_2___default().button),\n                        disabled: isLoading,\n                        children: isLoading ? 'Processing...' : 'Ask Question'\n                    }, void 0, false, {\n                        fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                        lineNumber: 164,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n                lineNumber: 154,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/laoluog/Documents/TA-Site/src/app/components/Student.tsx\",\n        lineNumber: 116,\n        columnNumber: 5\n    }, this);\n}\n_s(Student, \"AMEave1ncBfpujmZvnWTOWSLisg=\");\n_c = Student;\nvar _c;\n$RefreshReg$(_c, \"Student\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL3NyYy9hcHAvY29tcG9uZW50cy9TdHVkZW50LnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUVvRDtBQUNGO0FBRW5DLFNBQVNJLFFBQVEsS0FBeUI7UUFBekIsRUFBQ0MsU0FBUyxFQUFFQyxZQUFZLEVBQUMsR0FBekI7O0lBQzlCLE1BQU0sQ0FBQ0MsVUFBVUMsWUFBWSxHQUFHUiwrQ0FBUUEsQ0FBQztJQUN6QyxNQUFNLENBQUNTLFdBQVdDLGFBQWEsR0FBR1YsK0NBQVFBLENBQUM7SUFDM0MsTUFBTSxDQUFDVyxZQUFZQyxjQUFjLEdBQUdaLCtDQUFRQSxDQUFDO0lBQzdDLE1BQU0sQ0FBQ2EsbUJBQW1CQyxxQkFBcUIsR0FBR2QsK0NBQVFBLENBQUM7SUFDM0QsTUFBTSxDQUFDZSxVQUFVQyxZQUFZLEdBQUdoQiwrQ0FBUUEsQ0FBQztJQUN6QyxNQUFNLENBQUNpQixXQUFXQyxhQUFhLEdBQUdsQiwrQ0FBUUEsQ0FBQztJQUMzQyxNQUFNLENBQUNtQixTQUFTQyxXQUFXLEdBQUdwQiwrQ0FBUUEsQ0FBQztJQUN2QyxNQUFNLENBQUNxQixTQUFTQyxXQUFXLEdBQUd0QiwrQ0FBUUEsQ0FBQztJQUN2QyxNQUFNdUIsV0FBV3RCLDZDQUFNQSxDQUFtQjtJQUMxQyxNQUFNdUIsY0FBYyxJQUFJLG1CQUFtQjtJQUUzQyxpQ0FBaUM7SUFDakN0QixnREFBU0E7NkJBQUM7WUFDUjtxQ0FBTztvQkFDTCxJQUFJYSxVQUFVO3dCQUNaVSxJQUFJQyxlQUFlLENBQUNYO29CQUN0QjtnQkFDRjs7UUFDRjs0QkFBRztRQUFDQTtLQUFTO0lBRWIsaUNBQWlDO0lBQ2pDYixnREFBU0E7NkJBQUM7WUFDUixNQUFNeUIsUUFBUUosU0FBU0ssT0FBTztZQUM5QixJQUFJLENBQUNELE9BQU87WUFFWixNQUFNRTtnREFBYSxJQUFNWCxhQUFhOztZQUN0QyxNQUFNWTtpREFBYyxJQUFNWixhQUFhOztZQUN2QyxNQUFNYTtpREFBYyxJQUFN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Qjs7d0JBQzVCVTtzQ0FDRCw4REFBQ2dFOzRCQUFLSCxXQUFXdkUsZ0ZBQW1COzs7Ozs7Ozs7Ozs7Ozs7OzswQkFLMUMsOERBQUNzRTtnQkFBSUMsV0FBV3ZFLGtGQUFxQjs7a0NBQ25DLDhEQUFDc0U7d0JBQUlDLFdBQVcsR0FBd0J6RCxPQUFyQmQsOEVBQWlCLEVBQUMsS0FBb0MsT0FBakNjLFlBQVlkLDRFQUFlLEdBQUc7a0NBQ3BFLDRFQUFDa0Y7NEJBQ0NDLE9BQU07NEJBQ05DLE1BQUs7NEJBQ0xDLFNBQVE7NEJBQ1JDLFFBQU87c0NBRVAsNEVBQUNDO2dDQUNDQyxlQUFjO2dDQUNkQyxnQkFBZTtnQ0FDZkMsYUFBYTtnQ0FDYkMsR0FBRTs7Ozs7Ozs7Ozs7Ozs7OztrQ0FJUiw4REFBQ25FO3dCQUNDb0UsS0FBS3hFO3dCQUNMeUUsUUFBUTt3QkFDUkMsT0FBTzs0QkFBRUMsU0FBUzt3QkFBTzs7Ozs7Ozs7Ozs7OzBCQUk3Qiw4REFBQ0M7Z0JBQUtDLFVBQVVsRTtnQkFBY3dDLFdBQVd2RSx3RUFBVzs7a0NBQ2xELDhEQUFDa0c7d0JBQ0MzQixXQUFXdkUseUVBQVk7d0JBQ3ZCb0csT0FBT2hHO3dCQUNQaUcsVUFBVSxDQUFDckUsSUFBTTNCLFlBQVkyQixFQUFFc0UsTUFBTSxDQUFDRixLQUFLO3dCQUMzQ0csYUFBWTt3QkFDWkMsTUFBTTt3QkFDTkMsUUFBUTt3QkFDUkMsVUFBVXBHOzs7Ozs7a0NBRVosOERBQUNxRzt3QkFDQ25ELE1BQUs7d0JBQ0xlLFdBQVd2RSwwRUFBYTt3QkFDeEIwRyxVQUFVcEc7a0NBRVRBLFlBQVksa0JBQWtCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFLekM7R0F4S3dCTDtLQUFBQSIsInNvdXJjZXMiOlsiL1VzZXJzL2xhb2x1b2cvRG9jdW1lbnRzL1RBLVNpdGUvc3JjL2FwcC9jb21wb25lbnRzL1N0dWRlbnQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbIid1c2UgY2xpZW50JztcblxuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZVJlZiwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHN0eWxlcyBmcm9tICcuLi9zdHlsZXMvU3R1ZGVudC5tb2R1bGUuY3NzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gU3R1ZGVudCh7cXVlc3Rpb25zLCBzZXRRdWVzdGlvbnN9KSB7XG4gIGNvbnN0IFtxdWVzdGlvbiwgc2V0UXVlc3Rpb25dID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbaXNMb2FkaW5nLCBzZXRJc0xvYWRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbYWlSZXNwb25zZSwgc2V0QWlSZXNwb25zZV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtkaXNwbGF5ZWRSZXNwb25zZSwgc2V0RGlzcGxheWVkUmVzcG9uc2VdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbYXVkaW9VcmwsIHNldEF1ZGlvVXJsXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2lzUGxheWluZywgc2V0SXNQbGF5aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3N1YmplY3QsIHNldFN1YmplY3RdID0gdXNlU3RhdGUoJ0NvbXB1dGVyIFNjaWVuY2UnKTtcbiAgY29uc3QgW3RlYWNoZXIsIHNldFRlYWNoZXJdID0gdXNlU3RhdGUoJ0RyLiBTbWl0aCcpO1xuICBjb25zdCBhdWRpb1JlZiA9IHVzZVJlZjxIVE1MQXVkaW9FbGVtZW50PihudWxsKTtcbiAgY29uc3QgdHlwaW5nU3BlZWQgPSAzMDsgLy8gbXMgcGVyIGNoYXJhY3RlclxuXG4gIC8vIENsZWFudXAgZnVuY3Rpb24gZm9yIGJsb2IgVVJMc1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBpZiAoYXVkaW9VcmwpIHtcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChhdWRpb1VybCk7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW2F1ZGlvVXJsXSk7XG5cbiAgLy8gSGFuZGxlIGF1ZGlvIHBsYXkvcGF1c2UgZXZlbnRzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgYXVkaW8gPSBhdWRpb1JlZi5jdXJyZW50O1xuICAgIGlmICghYXVkaW8pIHJldHVybjtcblxuICAgIGNvbnN0IGhhbmRsZVBsYXkgPSAoKSA9PiBzZXRJc1BsYXlpbmcodHJ1ZSk7XG4gICAgY29uc3QgaGFuZGxlUGF1c2UgPSAoKSA9PiBzZXRJc1BsYXlpbmcoZmFsc2UpO1xuICAgIGNvbnN0IGhhbmRsZUVuZGVkID0gKCkgPT4gc2V0SXNQbGF5aW5nKGZhbHNlKTtcblxuICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoJ3BsYXknLCBoYW5kbGVQbGF5KTtcbiAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKCdwYXVzZScsIGhhbmRsZVBhdXNlKTtcbiAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKCdlbmRlZCcsIGhhbmRsZUVuZGVkKTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBhdWRpby5yZW1vdmVFdmVudExpc3RlbmVyKCdwbGF5JywgaGFuZGxlUGxheSk7XG4gICAgICBhdWRpby5yZW1vdmVFdmVudExpc3RlbmVyKCdwYXVzZScsIGhhbmRsZVBhdXNlKTtcbiAgICAgIGF1ZGlvLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2VuZGVkJywgaGFuZGxlRW5kZWQpO1xuICAgIH07XG4gIH0sIFtdKTtcblxuICBjb25zdCBoYW5kbGVTdWJtaXQgPSBhc3luYyAoZTogUmVhY3QuRm9ybUV2ZW50KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHNldElzTG9hZGluZyh0cnVlKTtcbiAgICBzZXRBdWRpb1VybCgnJyk7XG4gICAgc2V0SXNQbGF5aW5nKGZhbHNlKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKCdodHRwOi8vMTI3LjAuMC4xOjUwMDAvZmVlZGJhY2snLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBxdWVzdGlvbiB9KSxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCBlcnJvciEgc3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgIFxuICAgICAgaWYgKCFkYXRhLnJlc3BvbnNlIHx8ICFkYXRhLmF1ZGlvKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCByZXNwb25zZSBmb3JtYXQgZnJvbSBzZXJ2ZXInKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgc2V0QWlSZXNwb25zZShkYXRhLnJlc3BvbnNlKTtcbiAgICAgIHR5cGVSZXNwb25zZShkYXRhLnJlc3BvbnNlKTtcblxuICAgICAgaWYgKGRhdGEuc3ViamVjdCkgc2V0U3ViamVjdChkYXRhLnN1YmplY3QpO1xuICAgICAgaWYgKGRhdGEudGVhY2hlcikgc2V0VGVhY2hlcihkYXRhLnRlYWNoZXIpO1xuXG4gICAgICBjb25zdCBhdWRpb0RhdGEgPSBhdG9iKGRhdGEuYXVkaW8pO1xuICAgICAgY29uc3QgYXVkaW9BcnJheSA9IG5ldyBVaW50OEFycmF5KGF1ZGlvRGF0YS5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdWRpb0RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYXVkaW9BcnJheVtpXSA9IGF1ZGlvRGF0YS5jaGFyQ29kZUF0KGkpO1xuICAgICAgfVxuICAgICAgY29uc3QgYXVkaW9CbG9iID0gbmV3IEJsb2IoW2F1ZGlvQXJyYXldLCB7IHR5cGU6ICdhdWRpby9tcDMnIH0pO1xuICAgICAgY29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChhdWRpb0Jsb2IpO1xuICAgICAgXG4gICAgICBzZXRBdWRpb1VybCh1cmwpO1xuICAgICAgaWYgKGF1ZGlvUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgYXVkaW9SZWYuY3VycmVudC5zcmMgPSB1cmw7XG4gICAgICAgIGF1ZGlvUmVmLmN1cnJlbnQucGxheSgpO1xuICAgICAgfVxuXG4gICAgICBzZXRRdWVzdGlvbignJyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHN1Ym1pdHRpbmcgcXVlc3Rpb246JywgZXJyb3IpO1xuICAgICAgc2V0QWlSZXNwb25zZShlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdBbiBlcnJvciBvY2N1cnJlZCB3aGlsZSBwcm9jZXNzaW5nIHlvdXIgcmVxdWVzdC4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0SXNMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdHlwZVJlc3BvbnNlID0gKHRleHQ6IHN0cmluZykgPT4ge1xuICAgIGxldCBjdXJyZW50SW5kZXggPSAwO1xuICAgIHNldERpc3BsYXllZFJlc3BvbnNlKCcnKTtcbiAgICBcbiAgICBjb25zdCB0eXBpbmdJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmIChjdXJyZW50SW5kZXggPCB0ZXh0Lmxlbmd0aCkge1xuICAgICAgICBzZXREaXNwbGF5ZWRSZXNwb25zZShwcmV2ID0+IHByZXYgKyB0ZXh0W2N1cnJlbnRJbmRleF0pO1xuICAgICAgICBjdXJyZW50SW5kZXgrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodHlwaW5nSW50ZXJ2YWwpO1xuICAgICAgfVxuICAgIH0sIHR5cGluZ1NwZWVkKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuY29udGFpbmVyfT5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuY2xhc3NJbmZvfT5cbiAgICAgICAgPHNwYW4+U3ViamVjdDoge3N1YmplY3R9PC9zcGFuPlxuICAgICAgICA8c3Bhbj5UZWFjaGVyOiB7dGVhY2hlcn08L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAge2FpUmVzcG9uc2UgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnJlc3BvbnNlQ29udGFpbmVyfT5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9e3N0eWxlcy50eXBpbmdUZXh0fT5cbiAgICAgICAgICAgIHtkaXNwbGF5ZWRSZXNwb25zZX1cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17c3R5bGVzLnR5cGluZ0N1cnNvcn0gLz5cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5hdWRpb0NvbnRhaW5lcn0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgJHtzdHlsZXMuc3BlZWNoSWNvbn0gJHtpc1BsYXlpbmcgPyBzdHlsZXMuc3BlYWtpbmcgOiAnJ31gfT5cbiAgICAgICAgICA8c3ZnXG4gICAgICAgICAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICAgICAgICAgIGZpbGw9XCJub25lXCJcbiAgICAgICAgICAgIHZpZXdCb3g9XCIwIDAgMjQgMjRcIlxuICAgICAgICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8cGF0aFxuICAgICAgICAgICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgICAgICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg9ezJ9XG4gICAgICAgICAgICAgIGQ9XCJNMTkgMTFhNyA3IDAgMDEtNyA3bTAgMGE3IDcgMCAwMS03LTdtNyA3djRtMCAwSDhtNCAwaDRtLTQtOGEzIDMgMCAwMS0zLTNWNWEzIDMgMCAxMTYgMHY2YTMgMyAwIDAxLTMgM3pcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxhdWRpb1xuICAgICAgICAgIHJlZj17YXVkaW9SZWZ9XG4gICAgICAgICAgY29udHJvbHNcbiAgICAgICAgICBzdHlsZT17eyBkaXNwbGF5OiAnbm9uZScgfX1cbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3VibWl0fSBjbGFzc05hbWU9e3N0eWxlcy5mb3JtfT5cbiAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgY2xhc3NOYW1lPXtzdHlsZXMuaW5wdXR9XG4gICAgICAgICAgdmFsdWU9e3F1ZXN0aW9ufVxuICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0UXVlc3Rpb24oZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgIHBsYWNlaG9sZGVyPVwiQXNrIGEgcXVlc3Rpb24gYWJvdXQgeW91ciBjbGFzcyBvciBob21ld29yay4uLlwiXG4gICAgICAgICAgcm93cz17NH1cbiAgICAgICAgICByZXF1aXJlZFxuICAgICAgICAgIGRpc2FibGVkPXtpc0xvYWRpbmd9XG4gICAgICAgIC8+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICBjbGFzc05hbWU9e3N0eWxlcy5idXR0b259XG4gICAgICAgICAgZGlzYWJsZWQ9e2lzTG9hZGluZ31cbiAgICAgICAgPlxuICAgICAgICAgIHtpc0xvYWRpbmcgPyAnUHJvY2Vzc2luZy4uLicgOiAnQXNrIFF1ZXN0aW9uJ31cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgPC9kaXY+XG4gICk7XG59XG4iXSwibmFtZXMiOlsidXNlU3RhdGUiLCJ1c2VSZWYiLCJ1c2VFZmZlY3QiLCJzdHlsZXMiLCJTdHVkZW50IiwicXVlc3Rpb25zIiwic2V0UXVlc3Rpb25zIiwicXVlc3Rpb24iLCJzZXRRdWVzdGlvbiIsImlzTG9hZGluZyIsInNldElzTG9hZGluZyIsImFpUmVzcG9uc2UiLCJzZXRBaVJlc3BvbnNlIiwiZGlzcGxheWVkUmVzcG9uc2UiLCJzZXREaXNwbGF5ZWRSZXNwb25zZSIsImF1ZGlvVXJsIiwic2V0QXVkaW9VcmwiLCJpc1BsYXlpbmciLCJzZXRJc1BsYXlpbmciLCJzdWJqZWN0Iiwic2V0U3ViamVjdCIsInRlYWNoZXIiLCJzZXRUZWFjaGVyIiwiYXVkaW9SZWYiLCJ0eXBpbmdTcGVlZCIsIlVSTCIsInJldm9rZU9iamVjdFVSTCIsImF1ZGlvIiwiY3VycmVudCIsImhhbmRsZVBsYXkiLCJoYW5kbGVQYXVzZSIsImhhbmRsZUVuZGVkIiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJoYW5kbGVTdWJtaXQiLCJlIiwicHJldmVudERlZmF1bHQiLCJyZXNwb25zZSIsImZldGNoIiwibWV0aG9kIiwiaGVhZGVycyIsImJvZHkiLCJKU09OIiwic3RyaW5naWZ5Iiwib2siLCJFcnJvciIsInN0YXR1cyIsImRhdGEiLCJqc29uIiwidHlwZVJlc3BvbnNlIiwiYXVkaW9EYXRhIiwiYXRvYiIsImF1ZGlvQXJyYXkiLCJVaW50OEFycmF5IiwibGVuZ3RoIiwiaSIsImNoYXJDb2RlQXQiLCJhdWRpb0Jsb2IiLCJCbG9iIiwidHlwZSIsInVybCIsImNyZWF0ZU9iamVjdFVSTCIsInNyYyIsInBsYXkiLCJlcnJvciIsImNvbnNvbGUiLCJtZXNzYWdlIiwidGV4dCIsImN1cnJlbnRJbmRleCIsInR5cGluZ0ludGVydmFsIiwic2V0SW50ZXJ2YWwiLCJwcmV2IiwiY2xlYXJJbnRlcnZhbCIsImRpdiIsImNsYXNzTmFtZSIsImNvbnRhaW5lciIsImNsYXNzSW5mbyIsInNwYW4iLCJyZXNwb25zZUNvbnRhaW5lciIsInAiLCJ0eXBpbmdUZXh0IiwidHlwaW5nQ3Vyc29yIiwiYXVkaW9Db250YWluZXIiLCJzcGVlY2hJY29uIiwic3BlYWtpbmciLCJzdmciLCJ4bWxucyIsImZpbGwiLCJ2aWV3Qm94Iiwic3Ryb2tlIiwicGF0aCIsInN0cm9rZUxpbmVjYXAiLCJzdHJva2VMaW5lam9pbiIsInN0cm9rZVdpZHRoIiwiZCIsInJlZiIsImNvbnRyb2xzIiwic3R5bGUiLCJkaXNwbGF5IiwiZm9ybSIsIm9uU3VibWl0IiwidGV4dGFyZWEiLCJpbnB1dCIsInZhbHVlIiwib25DaGFuZ2UiLCJ0YXJnZXQiLCJwbGFjZWhvbGRlciIsInJvd3MiLCJyZXF1aXJlZCIsImRpc2FibGVkIiwiYnV0dG9uIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/app/components/Student.tsx\n"));

/***/ })

});