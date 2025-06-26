# Cloud Icons API Usage Examples

This document provides examples of how to use the Cloud Icons API in various programming languages. These examples demonstrate common operations like fetching providers, listing icons, and retrieving specific icons.

## Table of Contents

- [cURL](#curl)
- [JavaScript (Fetch API)](#javascript-fetch-api)
- [JavaScript (Node.js)](#javascript-nodejs)
- [Python](#python)
- [PHP](#php)
- [Ruby](#ruby)
- [Java](#java)
- [Go](#go)
- [C#](#c)

## cURL

### Get All Cloud Providers

```bash
curl -X GET "http://localhost:3002/cloud-providers"
```

### Get Icons for a Provider

```bash
curl -X GET "http://localhost:3002/azure/icons?page=1&pageSize=24&size=64"
```

### Search Icons

```bash
curl -X GET "http://localhost:3002/azure/icons?search=storage&tags=compute,storage"
```

### Get a Specific Icon (JSON)

```bash
curl -X GET "http://localhost:3002/azure/icon/storage-accounts?format=json&size=64"
```

### Get a Specific Icon (SVG)

```bash
curl -X GET "http://localhost:3002/azure/icon/storage-accounts?format=svg&size=128"
```

### Using API Key for Higher Rate Limits

```bash
curl -X GET "http://localhost:3002/azure/icons" -H "X-API-Key: your-api-key"
```

## JavaScript (Fetch API)

### Get All Cloud Providers

```javascript
fetch('http://localhost:3002/cloud-providers')
  .then(response => response.json())
  .then(providers => {
    console.log('Available providers:', providers);
  })
  .catch(error => console.error('Error fetching providers:', error));
```

### Get Icons for a Provider

```javascript
fetch('http://localhost:3002/azure/icons?page=1&pageSize=24&size=64')
  .then(response => response.json())
  .then(data => {
    console.log(`Found ${data.total} icons`);
    data.data.forEach(icon => {
      console.log(`- ${icon.icon_name}`);
    });
  })
  .catch(error => console.error('Error fetching icons:', error));
```

### Search Icons

```javascript
const searchTerm = 'storage';
const tags = ['compute', 'storage'];
const url = `http://localhost:3002/azure/icons?search=${encodeURIComponent(searchTerm)}&tags=${tags.join(',')}`;

fetch(url)
  .then(response => response.json())
  .then(data => {
    console.log(`Found ${data.total} icons matching "${searchTerm}" with tags: ${tags.join(', ')}`);
  })
  .catch(error => console.error('Error searching icons:', error));
```

### Get a Specific Icon (JSON)

```javascript
fetch('http://localhost:3002/azure/icon/storage-accounts?format=json&size=64')
  .then(response => response.json())
  .then(icon => {
    console.log('Icon details:', icon);
    // Use the SVG content
    document.getElementById('icon-container').innerHTML = icon.svg_content;
  })
  .catch(error => console.error('Error fetching icon:', error));
```

### Using API Key for Higher Rate Limits

```javascript
fetch('http://localhost:3002/azure/icons', {
  headers: {
    'X-API-Key': 'your-api-key'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

## JavaScript (Node.js)

```javascript
const https = require('https');

// Get all cloud providers
function getCloudProviders() {
  return new Promise((resolve, reject) => {
    https.get('https://api.cloudicons.example.com/cloud-providers', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Get icons for a provider
async function getIcons(provider, page = 1, pageSize = 24) {
  try {
    const url = `https://api.cloudicons.example.com/${provider}/icons?page=${page}&pageSize=${pageSize}`;
    
    const options = {
      headers: {
        'X-API-Key': 'your-api-key' // Optional
      }
    };
    
    return new Promise((resolve, reject) => {
      https.get(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error('Error fetching icons:', error);
    throw error;
  }
}

// Example usage
async function main() {
  try {
    const providers = await getCloudProviders();
    console.log('Available providers:', providers);
    
    const azureIcons = await getIcons('azure');
    console.log(`Found ${azureIcons.total} Azure icons`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

## Python

```python
import requests

# Base URL for the API
BASE_URL = "https://api.cloudicons.example.com"

# Optional API key for higher rate limits
API_KEY = "your-api-key"  # Replace with your actual API key

# Get all cloud providers
def get_cloud_providers():
    response = requests.get(f"{BASE_URL}/cloud-providers")
    response.raise_for_status()  # Raise an exception for HTTP errors
    return response.json()

# Get icons for a provider
def get_icons(provider, page=1, page_size=24, search=None, tags=None, size=64):
    params = {
        "page": page,
        "pageSize": page_size,
        "size": size
    }
    
    if search:
        params["search"] = search
        
    if tags:
        params["tags"] = ",".join(tags) if isinstance(tags, list) else tags
    
    headers = {}
    if API_KEY:
        headers["X-API-Key"] = API_KEY
    
    response = requests.get(
        f"{BASE_URL}/{provider}/icons",
        params=params,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Get a specific icon
def get_icon(provider, icon_name, format="json", size=64):
    params = {
        "format": format,
        "size": size
    }
    
    headers = {}
    if API_KEY:
        headers["X-API-Key"] = API_KEY
    
    response = requests.get(
        f"{BASE_URL}/{provider}/icon/{icon_name}",
        params=params,
        headers=headers
    )
    response.raise_for_status()
    
    if format == "json":
        return response.json()
    else:  # SVG format
        return response.text

# Example usage
if __name__ == "__main__":
    try:
        # Get all providers
        providers = get_cloud_providers()
        print(f"Available providers: {providers}")
        
        # Get Azure icons
        azure_icons = get_icons("azure", search="storage", tags=["compute", "storage"])
        print(f"Found {azure_icons['total']} Azure icons matching the search criteria")
        
        # Get a specific icon
        storage_icon = get_icon("azure", "storage-accounts")
        print(f"Icon name: {storage_icon['icon_name']}")
        
        # Get SVG content
        svg_content = get_icon("azure", "storage-accounts", format="svg", size=128)
        print(f"SVG content length: {len(svg_content)} characters")
        
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
```

## PHP

```php
<?php

// Base URL for the API
$baseUrl = "https://api.cloudicons.example.com";

// Optional API key for higher rate limits
$apiKey = "your-api-key";  // Replace with your actual API key

// Helper function to make API requests
function makeRequest($url, $params = [], $headers = []) {
    global $apiKey;
    
    // Add API key to headers if available
    if ($apiKey) {
        $headers[] = "X-API-Key: $apiKey";
    }
    
    // Build query string
    if (!empty($params)) {
        $url .= '?' . http_build_query($params);
    }
    
    // Initialize cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    // Execute the request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Check for errors
    if (curl_errno($ch)) {
        throw new Exception(curl_error($ch));
    }
    
    curl_close($ch);
    
    // Handle HTTP errors
    if ($httpCode >= 400) {
        throw new Exception("HTTP Error: $httpCode - $response");
    }
    
    // Parse JSON response
    $data = json_decode($response, true);
    
    // Check for JSON parsing errors
    if (json_last_error() !== JSON_ERROR_NONE) {
        return $response; // Return raw response for non-JSON responses (like SVG)
    }
    
    return $data;
}

// Get all cloud providers
function getCloudProviders() {
    global $baseUrl;
    return makeRequest("$baseUrl/cloud-providers");
}

// Get icons for a provider
function getIcons($provider, $page = 1, $pageSize = 24, $search = null, $tags = null, $size = 64) {
    global $baseUrl;
    
    $params = [
        'page' => $page,
        'pageSize' => $pageSize,
        'size' => $size
    ];
    
    if ($search) {
        $params['search'] = $search;
    }
    
    if ($tags) {
        $params['tags'] = is_array($tags) ? implode(',', $tags) : $tags;
    }
    
    return makeRequest("$baseUrl/$provider/icons", $params);
}

// Get a specific icon
function getIcon($provider, $iconName, $format = 'json', $size = 64) {
    global $baseUrl;
    
    $params = [
        'format' => $format,
        'size' => $size
    ];
    
    return makeRequest("$baseUrl/$provider/icon/$iconName", $params);
}

// Example usage
try {
    // Get all providers
    $providers = getCloudProviders();
    echo "Available providers: " . implode(', ', $providers) . "\n";
    
    // Get Azure icons
    $azureIcons = getIcons('azure', 1, 24, 'storage', ['compute', 'storage']);
    echo "Found {$azureIcons['total']} Azure icons matching the search criteria\n";
    
    // Get a specific icon
    $storageIcon = getIcon('azure', 'storage-accounts');
    echo "Icon name: {$storageIcon['icon_name']}\n";
    
    // Get SVG content
    $svgContent = getIcon('azure', 'storage-accounts', 'svg', 128);
    echo "SVG content length: " . strlen($svgContent) . " characters\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
```

## Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

# Base URL for the API
BASE_URL = "https://api.cloudicons.example.com"

# Optional API key for higher rate limits
API_KEY = "your-api-key"  # Replace with your actual API key

# Helper method to make API requests
def make_request(path, params = {}, headers = {})
  # Add API key to headers if available
  headers["X-API-Key"] = API_KEY if API_KEY
  
  # Build the URI
  uri = URI("#{BASE_URL}#{path}")
  uri.query = URI.encode_www_form(params) if params.any?
  
  # Make the request
  response = Net::HTTP.get_response(uri, headers)
  
  # Handle HTTP errors
  unless response.is_a?(Net::HTTPSuccess)
    raise "HTTP Error: #{response.code} - #{response.message}"
  end
  
  # Parse JSON response
  if response["Content-Type"]&.include?("application/json")
    JSON.parse(response.body)
  else
    response.body  # Return raw response for non-JSON responses (like SVG)
  end
end

# Get all cloud providers
def get_cloud_providers
  make_request("/cloud-providers")
end

# Get icons for a provider
def get_icons(provider, page: 1, page_size: 24, search: nil, tags: nil, size: 64)
  params = {
    page: page,
    pageSize: page_size,
    size: size
  }
  
  params[:search] = search if search
  params[:tags] = tags.is_a?(Array) ? tags.join(',') : tags if tags
  
  make_request("/#{provider}/icons", params)
end

# Get a specific icon
def get_icon(provider, icon_name, format: 'json', size: 64)
  params = {
    format: format,
    size: size
  }
  
  make_request("/#{provider}/icon/#{icon_name}", params)
end

# Example usage
begin
  # Get all providers
  providers = get_cloud_providers
  puts "Available providers: #{providers.join(', ')}"
  
  # Get Azure icons
  azure_icons = get_icons('azure', search: 'storage', tags: ['compute', 'storage'])
  puts "Found #{azure_icons['total']} Azure icons matching the search criteria"
  
  # Get a specific icon
  storage_icon = get_icon('azure', 'storage-accounts')
  puts "Icon name: #{storage_icon['icon_name']}"
  
  # Get SVG content
  svg_content = get_icon('azure', 'storage-accounts', format: 'svg', size: 128)
  puts "SVG content length: #{svg_content.length} characters"
  
rescue StandardError => e
  puts "Error: #{e.message}"
end
```

## Java

```java
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;

public class CloudIconsApiClient {
    
    private static final String BASE_URL = "https://api.cloudicons.example.com";
    private static final String API_KEY = "your-api-key"; // Replace with your actual API key
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    // Helper method to make API requests
    private static String makeRequest(String path, Map<String, String> params) throws Exception {
        // Build the URL with query parameters
        StringBuilder urlBuilder = new StringBuilder(BASE_URL + path);
        
        if (params != null && !params.isEmpty()) {
            urlBuilder.append("?");
            urlBuilder.append(params.entrySet().stream()
                .map(entry -> {
                    try {
                        return URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8.toString()) + "=" +
                               URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8.toString());
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                })
                .collect(Collectors.joining("&")));
        }
        
        // Create the connection
        URL url = new URL(urlBuilder.toString());
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        
        // Set request method and headers
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Accept", "application/json");
        
        // Add API key if available
        if (API_KEY != null && !API_KEY.isEmpty()) {
            connection.setRequestProperty("X-API-Key", API_KEY);
        }
        
        // Check for HTTP errors
        int responseCode = connection.getResponseCode();
        if (responseCode >= 400) {
            throw new RuntimeException("HTTP Error: " + responseCode);
        }
        
        // Read the response
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(connection.getInputStream()))) {
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            return response.toString();
        }
    }
    
    // Get all cloud providers
    public static List<String> getCloudProviders() throws Exception {
        String response = makeRequest("/cloud-providers", null);
        return objectMapper.readValue(response, List.class);
    }
    
    // Get icons for a provider
    public static Map<String, Object> getIcons(String provider, int page, int pageSize, 
                                              String search, List<String> tags, int size) throws Exception {
        Map<String, String> params = Map.of(
            "page", String.valueOf(page),
            "pageSize", String.valueOf(pageSize),
            "size", String.valueOf(size)
        );
        
        // Add optional parameters
        if (search != null && !search.isEmpty()) {
            params.put("search", search);
        }
        
        if (tags != null && !tags.isEmpty()) {
            params.put("tags", String.join(",", tags));
        }
        
        String response = makeRequest("/" + provider + "/icons", params);
        return objectMapper.readValue(response, Map.class);
    }
    
    // Get a specific icon
    public static Object getIcon(String provider, String iconName, String format, int size) throws Exception {
        Map<String, String> params = Map.of(
            "format", format,
            "size", String.valueOf(size)
        );
        
        String response = makeRequest("/" + provider + "/icon/" + iconName, params);
        
        if ("json".equals(format)) {
            return objectMapper.readValue(response, Map.class);
        } else {
            return response; // Return raw SVG content
        }
    }
    
    // Example usage
    public static void main(String[] args) {
        try {
            // Get all providers
            List<String> providers = getCloudProviders();
            System.out.println("Available providers: " + String.join(", ", providers));
            
            // Get Azure icons
            Map<String, Object> azureIcons = getIcons("azure", 1, 24, "storage", 
                                                     List.of("compute", "storage"), 64);
            System.out.println("Found " + azureIcons.get("total") + " Azure icons matching the search criteria");
            
            // Get a specific icon
            Map<String, Object> storageIcon = (Map<String, Object>) getIcon("azure", "storage-accounts", "json", 64);
            System.out.println("Icon name: " + storageIcon.get("icon_name"));
            
            // Get SVG content
            String svgContent = (String) getIcon("azure", "storage-accounts", "svg", 128);
            System.out.println("SVG content length: " + svgContent.length() + " characters");
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

## Go

```go
package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
)

const (
	BaseURL = "https://api.cloudicons.example.com"
	APIKey  = "your-api-key" // Replace with your actual API key
)

// Helper function to make API requests
func makeRequest(path string, params map[string]string) ([]byte, error) {
	// Build the URL with query parameters
	u, err := url.Parse(BaseURL + path)
	if err != nil {
		return nil, err
	}

	if params != nil {
		q := u.Query()
		for key, value := range params {
			q.Set(key, value)
		}
		u.RawQuery = q.Encode()
	}

	// Create the request
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		return nil, err
	}

	// Add API key if available
	if APIKey != "" {
		req.Header.Set("X-API-Key", APIKey)
	}

	// Make the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Check for HTTP errors
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("HTTP Error: %d - %s", resp.StatusCode, resp.Status)
	}

	// Read the response body
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}

// Get all cloud providers
func getCloudProviders() ([]string, error) {
	body, err := makeRequest("/cloud-providers", nil)
	if err != nil {
		return nil, err
	}

	var providers []string
	err = json.Unmarshal(body, &providers)
	if err != nil {
		return nil, err
	}

	return providers, nil
}

// Get icons for a provider
func getIcons(provider string, page int, pageSize int, search string, tags []string, size int) (map[string]interface{}, error) {
	params := map[string]string{
		"page":     fmt.Sprintf("%d", page),
		"pageSize": fmt.Sprintf("%d", pageSize),
		"size":     fmt.Sprintf("%d", size),
	}

	if search != "" {
		params["search"] = search
	}

	if len(tags) > 0 {
		params["tags"] = strings.Join(tags, ",")
	}

	body, err := makeRequest("/"+provider+"/icons", params)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	err = json.Unmarshal(body, &result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// Get a specific icon
func getIcon(provider string, iconName string, format string, size int) (interface{}, error) {
	params := map[string]string{
		"format": format,
		"size":   fmt.Sprintf("%d", size),
	}

	body, err := makeRequest("/"+provider+"/icon/"+iconName, params)
	if err != nil {
		return nil, err
	}

	if format == "json" {
		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		if err != nil {
			return nil, err
		}
		return result, nil
	}

	// Return raw SVG content
	return string(body), nil
}

func main() {
	// Get all providers
	providers, err := getCloudProviders()
	if err != nil {
		fmt.Printf("Error getting providers: %v\n", err)
		return
	}
	fmt.Printf("Available providers: %s\n", strings.Join(providers, ", "))

	// Get Azure icons
	azureIcons, err := getIcons("azure", 1, 24, "storage", []string{"compute", "storage"}, 64)
	if err != nil {
		fmt.Printf("Error getting icons: %v\n", err)
		return
	}
	fmt.Printf("Found %v Azure icons matching the search criteria\n", azureIcons["total"])

	// Get a specific icon
	storageIcon, err := getIcon("azure", "storage-accounts", "json", 64)
	if err != nil {
		fmt.Printf("Error getting icon: %v\n", err)
		return
	}
	iconMap := storageIcon.(map[string]interface{})
	fmt.Printf("Icon name: %s\n", iconMap["icon_name"])

	// Get SVG content
	svgContent, err := getIcon("azure", "storage-accounts", "svg", 128)
	if err != nil {
		fmt.Printf("Error getting SVG: %v\n", err)
		return
	}
	fmt.Printf("SVG content length: %d characters\n", len(svgContent.(string)))
}
```

## C#

```csharp
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Web;

namespace CloudIconsApiClient
{
    class Program
    {
        private static readonly string BaseUrl = "https://api.cloudicons.example.com";
        private static readonly string ApiKey = "your-api-key"; // Replace with your actual API key
        private static readonly HttpClient client = new HttpClient();

        static async Task Main(string[] args)
        {
            try
            {
                // Set up the HTTP client
                client.DefaultRequestHeaders.Add("Accept", "application/json");
                if (!string.IsNullOrEmpty(ApiKey))
                {
                    client.DefaultRequestHeaders.Add("X-API-Key", ApiKey);
                }

                // Get all providers
                var providers = await GetCloudProviders();
                Console.WriteLine($"Available providers: {string.Join(", ", providers)}");

                // Get Azure icons
                var azureIcons = await GetIcons("azure", search: "storage", tags: new[] { "compute", "storage" });
                Console.WriteLine($"Found {azureIcons.GetProperty("total").GetInt32()} Azure icons matching the search criteria");

                // Get a specific icon
                var storageIcon = await GetIcon("azure", "storage-accounts");
                Console.WriteLine($"Icon name: {storageIcon.GetProperty("icon_name").GetString()}");

                // Get SVG content
                var svgContent = await GetIconSvg("azure", "storage-accounts", size: 128);
                Console.WriteLine($"SVG content length: {svgContent.Length} characters");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
        }

        // Get all cloud providers
        private static async Task<string[]> GetCloudProviders()
        {
            var response = await client.GetStringAsync($"{BaseUrl}/cloud-providers");
            return JsonSerializer.Deserialize<string[]>(response);
        }

        // Get icons for a provider
        private static async Task<JsonElement> GetIcons(string provider, int page = 1, int pageSize = 24, 
                                                      string search = null, string[] tags = null, int size = 64)
        {
            var query = HttpUtility.ParseQueryString(string.Empty);
            query["page"] = page.ToString();
            query["pageSize"] = pageSize.ToString();
            query["size"] = size.ToString();

            if (!string.IsNullOrEmpty(search))
            {
                query["search"] = search;
            }

            if (tags != null && tags.Length > 0)
            {
                query["tags"] = string.Join(",", tags);
            }

            var response = await client.GetStringAsync($"{BaseUrl}/{provider}/icons?{query}");
            return JsonDocument.Parse(response).RootElement;
        }

        // Get a specific icon (JSON format)
        private static async Task<JsonElement> GetIcon(string provider, string iconName, int size = 64)
        {
            var query = HttpUtility.ParseQueryString(string.Empty);
            query["format"] = "json";
            query["size"] = size.ToString();

            var response = await client.GetStringAsync($"{BaseUrl}/{provider}/icon/{iconName}?{query}");
            return JsonDocument.Parse(response).RootElement;
        }

        // Get a specific icon (SVG format)
        private static async Task<string> GetIconSvg(string provider, string iconName, int size = 64)
        {
            var query = HttpUtility.ParseQueryString(string.Empty);
            query["format"] = "svg";
            query["size"] = size.ToString();

            return await client.GetStringAsync($"{BaseUrl}/{provider}/icon/{iconName}?{query}");
        }
    }
}
```

These examples demonstrate how to interact with the Cloud Icons API in various programming languages. You can adapt these examples to fit your specific use case and environment.