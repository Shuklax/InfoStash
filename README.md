## Setup

Make sure you've installed Node.js (version 22+). Then run:

```bash
npm install
```

Create a DB file named data.db in the root

To setup the dataset:

```bash
npm run setup
```

Create a env file as given in the example with your openRouter API_KEY

To run your server:

```bash
npm run dev
```

To check that your code compiles successfully:

```bash
npm run build
```

## Then open <http://localhost:3000> to see your site.

# Run through Dockerfile

After cloning the Repo locally

Build the image locally

```bash
docker build -t infostash:0.1.0 .
```

Run the container

```bash
docker run -p 3000:3000 \
  -e OPENROUTER_API_KEY="your-api-key-here" \
  infostash

```
---
<img width="4662" height="5725" alt="image" src="https://github.com/user-attachments/assets/f1dd1c84-3836-480a-9789-6a44d3548230" />

<img width="4430" height="7980" alt="image" src="https://github.com/user-attachments/assets/df7427b1-5aff-4e6e-abd7-cf66b9fdd3ba" />

<img width="4428" height="7953" alt="image" src="https://github.com/user-attachments/assets/36d7eac0-699c-4110-8b03-1a0859b2c5c2" />

---
# InfoStash Search API

## Base URL

https://your-domain.com/api

## Single Endpoint

**POST** `/search`

Search companies using structured filters.

## Request Format

Send a JSON object with these filters:

```json
{
  "technologyFilter": {
    "and": ["React", "Node.js"],
    "or": ["TypeScript"],
    "none": ["PHP"],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "countryFilter": {
    "and": [],
    "or": ["US", "UK"],
    "none": [],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "categoryFilter": {
    "and": ["Technology"],
    "or": [],
    "none": [],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "nameFilter": {
    "and": [],
    "or": ["Google", "Microsoft"],
    "none": ["Facebook"],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "domainFilter": {
    "and": [],
    "or": [],
    "none": ["spam.com"],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "numberFilter": {
    "totalTechnologies": 5,
    "technologiesPerCategory": 2
  }
}
```

## Filter Logic

- **`and`**: ALL items must be present
- **`or`**: ANY item can be present
- **`none`**: NO items can be present
- **`filteringType`**: Use `"together"` (recommended)
- **`totalTechnologies`**: Minimum total techs required
- **`technologiesPerCategory`**: Minimum techs per category

## Response

```json
{
  "success": true,
  "data": [
    {
      "domain": "google.com",
      "name": "Google",
      "category": "Technology",
      "country": "US",
      "city": "Mountain View",
      "technologies": 15
    }
  ],
  "totalResults": 1,
  "source": "external"
}
```

## Example Usage

### Find React companies in US:

```json
{
  "technologyFilter": {
    "and": [],
    "or": ["React"],
    "none": [],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "countryFilter": {
    "and": ["US"],
    "or": [],
    "none": [],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "categoryFilter": {
    "and": [],
    "or": [],
    "none": [],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "nameFilter": {
    "and": [],
    "or": [],
    "none": [],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "domainFilter": {
    "and": [],
    "or": [],
    "none": [],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "numberFilter": {
    "totalTechnologies": 0,
    "technologiesPerCategory": 0
  }
}
```

### Find large tech companies (not Facebook):

```json
{
  "technologyFilter": {
    "and": [],
    "or": [],
    "none": [],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "countryFilter": {
    "and": [],
    "or": [],
    "none": [],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "categoryFilter": {
    "and": ["Technology"],
    "or": [],
    "none": [],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "nameFilter": {
    "and": [],
    "or": [],
    "none": ["Facebook"],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "domainFilter": {
    "and": [],
    "or": [],
    "none": [],
    "removeDuplicates": false,
    "filteringType": "together"
  },
  "numberFilter": {
    "totalTechnologies": 10,
    "technologiesPerCategory": 0
  }
}
```

## Curl Example

```bash
curl -X POST https://your-domain.com/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "technologyFilter": {
      "and": [],
      "or": ["React"],
      "none": [],
      "removeDuplicates": false,
      "filteringType": "together"
    },
    "countryFilter": {
      "and": ["US"],
      "or": [],
      "none": [],
      "removeDuplicates": false,
      "filteringType": "together"
    },
    "categoryFilter": {
      "and": [],
      "or": [],
      "none": [],
      "removeDuplicates": false,
      "filteringType": "together"
    },
    "nameFilter": {
      "and": [],
      "or": [],
      "none": [],
      "removeDuplicates": false,
      "filteringType": "together"
    },
    "domainFilter": {
      "and": [],
      "or": [],
      "none": [],
      "removeDuplicates": false,
      "filteringType": "together"
    },
    "numberFilter": {
      "totalTechnologies": 0,
      "technologiesPerCategory": 0
    }
  }'
```

## Error Responses

- `400`: Bad JSON format
- `500`: Server error

That's it. One endpoint, send JSON, get companies.
