{
  "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
  "version": "2.1.0",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "StrataMetriq",
          "informationUri": "https://github.com/aabid-wani/stratametriq",
          "semanticVersion": "1.4.1",
          "rules": [
            {
              "id": "SMQ-DEBUG_CODE",
              "name": "Debug code",
              "shortDescription": {
                "text": "Architectural & Security Governance: Debug code"
              },
              "defaultConfiguration": {
                "level": "error"
              }
            },
            {
              "id": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
              "name": "Large commented code blocks",
              "shortDescription": {
                "text": "Architectural & Security Governance: Large commented code blocks"
              },
              "defaultConfiguration": {
                "level": "note"
              }
            },
            {
              "id": "SMQ-TEST_DATA",
              "name": "Test data",
              "shortDescription": {
                "text": "Architectural & Security Governance: Test data"
              },
              "defaultConfiguration": {
                "level": "error"
              }
            },
            {
              "id": "SMQ-UNUSED_DEVELOPMENT_IMPORTS",
              "name": "Unused development imports",
              "shortDescription": {
                "text": "Architectural & Security Governance: Unused development imports"
              },
              "defaultConfiguration": {
                "level": "warning"
              }
            },
            {
              "id": "SMQ-ARCH-CIRCULAR",
              "name": "CircularDependency",
              "shortDescription": {
                "text": "Circular dependency loop detected across modules"
              },
              "defaultConfiguration": {
                "level": "error"
              }
            },
            {
              "id": "SMQ-ARCH-DUPLICATE",
              "name": "CodeDuplication",
              "shortDescription": {
                "text": "High logic similarity / duplicate code snippet detected"
              },
              "defaultConfiguration": {
                "level": "warning"
              }
            }
          ]
        }
      },
      "results": [
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "backend/stock_management/app/config/db.connect.js"
                },
                "region": {
                  "startLine": 11
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found commented-out code or inactive logic block (2+ lines)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "backend/stock_management/app/models/permission.model.js"
                },
                "region": {
                  "startLine": 94
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found commented-out code or inactive logic block (2+ lines)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "backend/stock_management/app/models/product.model.js"
                },
                "region": {
                  "startLine": 179
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "backend/stock_management/server.js"
                },
                "region": {
                  "startLine": 61
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-TEST_DATA",
          "level": "error",
          "message": {
            "text": "Test suite, mock data, or test fixture detected"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/App.test.jsx"
                },
                "region": {
                  "startLine": 3
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-UNUSED_DEVELOPMENT_IMPORTS",
          "level": "warning",
          "message": {
            "text": "Development or testing package imported (@testing-library/react)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/App.test.jsx"
                },
                "region": {
                  "startLine": 1
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/assets/Assets.jsx"
                },
                "region": {
                  "startLine": 103
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/assets/AssetType.jsx"
                },
                "region": {
                  "startLine": 101
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/assets/Location.jsx"
                },
                "region": {
                  "startLine": 69
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found block comment containing commented-out source code"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/assets/Location.jsx"
                },
                "region": {
                  "startLine": 167
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found block comment containing commented-out source code"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/detailsPages/UserDetailPage.jsx"
                },
                "region": {
                  "startLine": 115
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found block comment containing commented-out source code"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/detailsPages/VendorDetailPage.jsx"
                },
                "region": {
                  "startLine": 255
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/layout/Header.jsx"
                },
                "region": {
                  "startLine": 398
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found block comment containing commented-out source code"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/layout/Header.jsx"
                },
                "region": {
                  "startLine": 317
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found block comment containing commented-out source code"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/layout/Sidebar.jsx"
                },
                "region": {
                  "startLine": 188
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found block comment containing commented-out source code"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/AddMultipleProvision.jsx"
                },
                "region": {
                  "startLine": 205
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found block comment containing commented-out source code"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/AddOrder.jsx"
                },
                "region": {
                  "startLine": 208
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/Branch.jsx"
                },
                "region": {
                  "startLine": 132
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found block comment containing commented-out source code"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/Branch.jsx"
                },
                "region": {
                  "startLine": 257
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/Employee.jsx"
                },
                "region": {
                  "startLine": 113
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found block comment containing commented-out source code"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/Employee.jsx"
                },
                "region": {
                  "startLine": 225
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/Issue.jsx"
                },
                "region": {
                  "startLine": 154
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found block comment containing commented-out source code"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/Issue.jsx"
                },
                "region": {
                  "startLine": 281
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/Product.jsx"
                },
                "region": {
                  "startLine": 124
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-LARGE_COMMENTED_CODE_BLOCKS",
          "level": "note",
          "message": {
            "text": "Found block comment containing commented-out source code"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/Product.jsx"
                },
                "region": {
                  "startLine": 363
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/ProductCategory.jsx"
                },
                "region": {
                  "startLine": 32
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/User.jsx"
                },
                "region": {
                  "startLine": 242
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/pages/Vendor.jsx"
                },
                "region": {
                  "startLine": 53
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/permissions/Module.jsx"
                },
                "region": {
                  "startLine": 33
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-DEBUG_CODE",
          "level": "error",
          "message": {
            "text": "Found active debug statement (console, debugger, alert)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/permissions/Role.jsx"
                },
                "region": {
                  "startLine": 31
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-TEST_DATA",
          "level": "error",
          "message": {
            "text": "Test suite, mock data, or test fixture detected"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/setupTests.jsx"
                },
                "region": {
                  "startLine": 1
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-UNUSED_DEVELOPMENT_IMPORTS",
          "level": "warning",
          "message": {
            "text": "Development or testing package imported (@testing-library/jest-dom)"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/setupTests.jsx"
                },
                "region": {
                  "startLine": 1
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-ARCH-CIRCULAR",
          "level": "error",
          "message": {
            "text": "Circular dependency loop #1 detected: D:\\stock-management-ibirds\\frontend\\stock_management\\src\\App.jsx -> D:\\stock-management-ibirds\\frontend\\stock_management\\src\\components\\pages\\User.jsx -> D:\\stock-management-ibirds\\frontend\\stock_management\\src\\App.jsx"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "D:\\stock-management-ibirds\\frontend\\stock_management\\src\\App.jsx"
                },
                "region": {
                  "startLine": 1
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-ARCH-DUPLICATE",
          "level": "warning",
          "message": {
            "text": "High logic duplication (100%) detected between D:\\stock-management-ibirds\\frontend\\stock_management\\src\\components\\assets\\Assets.jsx and D:\\stock-management-ibirds\\frontend\\stock_management\\src\\components\\assets\\AssetType.jsx"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "frontend/stock_management/src/components/assets/Assets.jsx"
                },
                "region": {
                  "startLine": 42
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-ARCH-DUPLICATE",
          "level": "warning",
          "message": {
            "text": "High logic duplication (70%) detected between D:\\stock-management-ibirds\\backend\\stock_management\\app\\models\\module.model.js and D:\\stock-management-ibirds\\backend\\stock_management\\app\\models\\role.model.js"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "backend/stock_management/app/models/module.model.js"
                },
                "region": {
                  "startLine": 12
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-ARCH-DUPLICATE",
          "level": "warning",
          "message": {
            "text": "High logic duplication (69%) detected between D:\\stock-management-ibirds\\backend\\stock_management\\app\\routes\\module.routes.js and D:\\stock-management-ibirds\\backend\\stock_management\\app\\routes\\vendor.routes.js"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "backend/stock_management/app/routes/module.routes.js"
                },
                "region": {
                  "startLine": 1
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-ARCH-DUPLICATE",
          "level": "warning",
          "message": {
            "text": "High logic duplication (67%) detected between D:\\stock-management-ibirds\\backend\\stock_management\\app\\routes\\branch.routes.js and D:\\stock-management-ibirds\\backend\\stock_management\\app\\routes\\prd_category.routes.js"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "backend/stock_management/app/routes/branch.routes.js"
                },
                "region": {
                  "startLine": 1
                }
              }
            }
          ]
        },
        {
          "ruleId": "SMQ-ARCH-DUPLICATE",
          "level": "warning",
          "message": {
            "text": "High logic duplication (65%) detected between D:\\stock-management-ibirds\\backend\\stock_management\\app\\models\\branch.model.js and D:\\stock-management-ibirds\\backend\\stock_management\\app\\models\\module.model.js"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "backend/stock_management/app/models/branch.model.js"
                },
                "region": {
                  "startLine": 14
                }
              }
            }
          ]
        }
      ]
    }
  ]
}