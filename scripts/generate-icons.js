#!/usr/bin/env node

/**
 * Script to generate icons.json from filesystem icons
 * Supports AWS, Azure, and Alibaba Cloud providers
 */

const fs = require('fs').promises;
const path = require('path');

// Provider configurations
const PROVIDERS = {
  aws: {
    name: 'aws',
    license: 'AWS trademark',
    defaultTags: ['aws', 'cloud']
  },
  azure: {
    name: 'azure', 
    license: 'Microsoft Azure trademark',
    defaultTags: ['azure', 'microsoft', 'cloud']
  },
  alibaba: {
    name: 'alibaba',
    license: 'Alibaba Cloud trademark',
    defaultTags: ['alibaba', 'aliyun', 'cloud']
  }
};

// Base paths
const ICONS_BASE_PATH = path.join(__dirname, '..', 'public', 'icons');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'icons.json');

/**
 * Generate smart tags based on filename and provider
 */
function generateTags(filename, provider) {
  const baseTags = [...PROVIDERS[provider].defaultTags];
  
  // Remove file extension and normalize
  const cleanName = filename.replace('.svg', '').toLowerCase();
  
  // Tag mapping based on common service patterns
  const tagMappings = {
    // Computing & Infrastructure
    'ec2': ['compute', 'virtual-machine', 'instance'],
    'lambda': ['serverless', 'function', 'compute'],
    'fargate': ['container', 'serverless', 'compute'],
    'elastic-beanstalk': ['application', 'deployment', 'platform'],
    'batch': ['compute', 'batch-processing'],
    'ecs': ['container', 'orchestration'],
    'eks': ['kubernetes', 'container', 'orchestration'],
    'auto-scaling': ['scaling', 'compute'],
    
    // Storage
    's3': ['storage', 'object-storage'],
    'simple-storage-service': ['storage', 'object-storage'],
    'ebs': ['storage', 'block-storage'],
    'elastic-block-store': ['storage', 'block-storage'],
    'efs': ['storage', 'file-system'],
    'elastic-file-system': ['storage', 'file-system'],
    'fsx': ['storage', 'file-system'],
    'storage': ['storage'],
    'backup': ['storage', 'backup'],
    'glacier': ['storage', 'archive'],
    
    // Database
    'rds': ['database', 'relational'],
    'dynamodb': ['database', 'nosql'],
    'aurora': ['database', 'relational'],
    'documentdb': ['database', 'document'],
    'elasticache': ['database', 'cache'],
    'redshift': ['database', 'analytics', 'warehouse'],
    'memcache': ['database', 'cache'],
    'mongodb': ['database', 'nosql'],
    'mysql': ['database', 'relational'],
    'postgresql': ['database', 'relational'],
    'database': ['database'],
    
    // Networking
    'vpc': ['networking', 'virtual-network'],
    'cloudfront': ['networking', 'cdn'],
    'route-53': ['networking', 'dns'],
    'elastic-load-balancing': ['networking', 'load-balancer'],
    'application-load-balancer': ['networking', 'load-balancer'],
    'network-load-balancer': ['networking', 'load-balancer'],
    'gateway': ['networking', 'gateway'],
    'direct-connect': ['networking', 'connection'],
    'vpn': ['networking', 'vpn', 'security'],
    'cdn': ['networking', 'cdn'],
    'load-balancer': ['networking', 'load-balancer'],
    
    // Security & Identity
    'iam': ['security', 'identity', 'access-management'],
    'identity-access-management': ['security', 'identity', 'access-management'],
    'cognito': ['security', 'identity', 'authentication'],
    'certificate-manager': ['security', 'ssl', 'certificate'],
    'key-management': ['security', 'encryption', 'key-management'],
    'guard-duty': ['security', 'threat-detection'],
    'inspector': ['security', 'assessment'],
    'security': ['security'],
    'waf': ['security', 'firewall'],
    'shield': ['security', 'ddos-protection'],
    'firewall': ['security', 'firewall'],
    
    // Analytics & AI/ML
    'sagemaker': ['ai-ml', 'machine-learning'],
    'comprehend': ['ai-ml', 'nlp'],
    'rekognition': ['ai-ml', 'computer-vision'],
    'translate': ['ai-ml', 'translation'],
    'polly': ['ai-ml', 'text-to-speech'],
    'lex': ['ai-ml', 'chatbot'],
    'kinesis': ['analytics', 'streaming'],
    'athena': ['analytics', 'query'],
    'glue': ['analytics', 'etl'],
    'emr': ['analytics', 'big-data'],
    'quicksight': ['analytics', 'visualization'],
    'data': ['analytics', 'data'],
    'analytics': ['analytics'],
    
    // Monitoring & Management
    'cloudwatch': ['monitoring', 'metrics'],
    'cloudtrail': ['monitoring', 'audit'],
    'config': ['monitoring', 'configuration'],
    'systems-manager': ['management', 'administration'],
    'cloudformation': ['management', 'infrastructure-as-code'],
    'monitoring': ['monitoring'],
    
    // Integration & Messaging
    'sns': ['messaging', 'notification'],
    'sqs': ['messaging', 'queue'],
    'eventbridge': ['messaging', 'event-driven'],
    'api-gateway': ['api', 'gateway'],
    'step-functions': ['orchestration', 'workflow'],
    'messaging': ['messaging'],
    
    // Development Tools
    'codecommit': ['developer-tools', 'version-control'],
    'codebuild': ['developer-tools', 'ci-cd'],
    'codedeploy': ['developer-tools', 'deployment'],
    'codepipeline': ['developer-tools', 'ci-cd'],
    'cloud9': ['developer-tools', 'ide'],
    'dev': ['developer-tools'],
    
    // IoT
    'iot': ['iot', 'internet-of-things'],
    'greengrass': ['iot', 'edge-computing'],
    
    // Media & Content
    'media': ['media', 'content'],
    'elemental': ['media', 'video'],
    
    // Migration & Transfer
    'migration': ['migration', 'transfer'],
    'transfer': ['migration', 'transfer'],
    'datasync': ['migration', 'data-transfer']
  };
  
  // Apply tag mappings
  const additionalTags = new Set();
  
  Object.entries(tagMappings).forEach(([keyword, tags]) => {
    if (cleanName.includes(keyword)) {
      tags.forEach(tag => additionalTags.add(tag));
    }
  });
  
  // Add service-specific tags based on common patterns
  if (cleanName.includes('web')) additionalTags.add('web');
  if (cleanName.includes('mobile')) additionalTags.add('mobile');
  if (cleanName.includes('enterprise')) additionalTags.add('enterprise');
  if (cleanName.includes('managed')) additionalTags.add('managed');
  if (cleanName.includes('elastic')) additionalTags.add('elastic');
  if (cleanName.includes('simple')) additionalTags.add('simple');
  if (cleanName.includes('application')) additionalTags.add('application');
  if (cleanName.includes('service')) additionalTags.add('service');
  if (cleanName.includes('studio')) additionalTags.add('studio');
  if (cleanName.includes('workspace')) additionalTags.add('workspace');
  
  return [...baseTags, ...Array.from(additionalTags)];
}

/**
 * Convert filename to human-readable icon name
 */
function formatIconName(filename) {
  return filename
    .replace('.svg', '')
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate icon description
 */
function generateDescription(iconName, provider) {
  const providerNames = {
    aws: 'AWS',
    azure: 'Azure',
    alibaba: 'Alibaba Cloud'
  };
  
  return `${providerNames[provider]} service for ${iconName}`;
}

/**
 * Scan directory for SVG files and generate icon objects
 */
async function scanProviderIcons(provider) {
  const providerPath = path.join(ICONS_BASE_PATH, provider);
  const icons = [];
  
  try {
    const files = await fs.readdir(providerPath);
    const svgFiles = files.filter(file => file.endsWith('.svg'));
    
    console.log(`Found ${svgFiles.length} SVG files for ${provider}`);
    
    for (const file of svgFiles) {
      const id = file.replace('.svg', '');
      const iconName = formatIconName(file);
      const tags = generateTags(file, provider);
      
      const icon = {
        id: `${provider}-${id}`,
        provider: provider,
        icon_name: iconName,
        description: generateDescription(iconName, provider),
        tags: tags,
        svg_path: `/icons/${provider}/${file}`,
        license: PROVIDERS[provider].license
      };
      
      icons.push(icon);
    }
    
    console.log(`Generated ${icons.length} icon entries for ${provider}`);
    return icons;
    
  } catch (error) {
    console.error(`Error scanning ${provider} icons:`, error);
    return [];
  }
}

/**
 * Load existing icons from JSON file
 */
async function loadExistingIcons() {
  try {
    const data = await fs.readFile(OUTPUT_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No existing icons.json found or error reading it:', error.message);
    return [];
  }
}

/**
 * Main function to generate icons.json
 */
async function generateIconsJson() {
  console.log('Starting icon generation...');
  
  // Load existing icons
  const existingIcons = await loadExistingIcons();
  console.log(`Loaded ${existingIcons.length} existing icons`);
  
  // Keep existing non-AWS/Alibaba icons (like Azure)
  const keptIcons = existingIcons.filter(icon => 
    !icon.provider.startsWith('aws') && 
    !icon.provider.startsWith('alibaba')
  );
  console.log(`Keeping ${keptIcons.length} existing icons from other providers`);
  
  // Generate new icons for each provider
  const allNewIcons = [];
  
  for (const provider of ['aws', 'alibaba']) {
    const providerIcons = await scanProviderIcons(provider);
    allNewIcons.push(...providerIcons);
  }
  
  // Combine existing kept icons with new ones
  const allIcons = [...keptIcons, ...allNewIcons];
  
  // Sort by provider then by icon name
  allIcons.sort((a, b) => {
    if (a.provider !== b.provider) {
      return a.provider.localeCompare(b.provider);
    }
    return a.icon_name.localeCompare(b.icon_name);
  });
  
  // Write to file
  console.log(`Writing ${allIcons.length} icons to ${OUTPUT_PATH}`);
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(allIcons, null, 2));
  
  // Generate summary
  const summary = {};
  allIcons.forEach(icon => {
    summary[icon.provider] = (summary[icon.provider] || 0) + 1;
  });
  
  console.log('\n=== Generation Summary ===');
  Object.entries(summary).forEach(([provider, count]) => {
    console.log(`${provider}: ${count} icons`);
  });
  console.log(`Total: ${allIcons.length} icons`);
  console.log('\nGeneration completed successfully!');
}

// Run the script
if (require.main === module) {
  generateIconsJson().catch(error => {
    console.error('Error generating icons:', error);
    process.exit(1);
  });
}

module.exports = { generateIconsJson };