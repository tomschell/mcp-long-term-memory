#!/usr/bin/env node

import { program } from 'commander';
import { initializeDatabase } from './db/init.js';
import { DatabaseService, MemoryType, Memory } from './db/service.js';
import { config } from 'dotenv';
import path from 'path';
import { storeDevProgress } from './dev-memory.js';

// Load environment variables
config();

// Initialize database
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'memory.db');
const db = await initializeDatabase(dbPath);
const dbService = new DatabaseService(db);

program
    .name('mem')
    .description('CLI tool for managing development memories')
    .version('1.0.0');

program
    .command('store')
    .description('Store a new development memory')
    .argument('<content>', 'The content of the memory')
    .option('-t, --type <type>', 'Type of memory (conversation, code, decision, reference)', 'code')
    .option('-s, --status <status>', 'Implementation status')
    .option('-k, --key-decisions <decisions...>', 'Key decisions made')
    .option('-c, --code-changes <changes...>', 'Code changes made')
    .option('-f, --files <files...>', 'Files created or modified')
    .option('--tags <tags...>', 'Tags to associate with the memory')
    .action(async (content, options) => {
        try {
            const memoryId = await storeDevProgress(dbService, content, options.type as MemoryType, {
                implementation_status: options.status,
                key_decisions: options.keyDecisions,
                code_changes: options.codeChanges,
                files_created: options.files,
                date: new Date().toISOString()
            });

            if (options.tags) {
                dbService.addMemoryTags(memoryId, options.tags);
            }

            console.log(`✨ Memory stored successfully with ID: ${memoryId}`);
        } catch (error) {
            console.error('❌ Failed to store memory:', error);
            process.exit(1);
        }
    });

program
    .command('list')
    .description('List recent development memories')
    .option('-l, --limit <number>', 'Number of memories to show', '5')
    .option('-t, --tag <tag>', 'Filter by tag')
    .action(async (options) => {
        try {
            const memories = dbService.getDevMemories();
            const limit = parseInt(options.limit);
            
            let filtered = memories;
            if (options.tag) {
                // TODO: Implement tag filtering
                console.log(`Note: Tag filtering not yet implemented`);
            }

            console.log('\n📝 Recent Memories:\n');
            filtered.slice(0, limit).forEach(memory => {
                const metadata = JSON.parse(memory.metadata);
                console.log(`ID: ${memory.memory_id} (${memory.content_type}) - ${memory.created_at}`);
                console.log(`Content: ${memory.content}`);
                if (metadata.implementation_status) {
                    console.log(`Status: ${metadata.implementation_status}`);
                }
                if (metadata.key_decisions) {
                    console.log('Key Decisions:', metadata.key_decisions.join(', '));
                }
                console.log('---');
            });
        } catch (error) {
            console.error('❌ Failed to list memories:', error);
            process.exit(1);
        }
    });

program
    .command('get')
    .description('Get a specific memory by ID')
    .argument('<id>', 'Memory ID')
    .action(async (id) => {
        try {
            const memory = dbService.getMemory(parseInt(id));
            if (!memory) {
                console.error('❌ Memory not found');
                process.exit(1);
            }

            const metadata = JSON.parse(memory.metadata);
            console.log('\n📖 Memory Details:\n');
            console.log(`ID: ${memory.memory_id}`);
            console.log(`Type: ${memory.content_type}`);
            console.log(`Created: ${memory.created_at}`);
            console.log(`\nContent: ${memory.content}`);
            console.log('\nMetadata:');
            if (metadata.implementation_status) {
                console.log(`- Status: ${metadata.implementation_status}`);
            }
            if (metadata.key_decisions) {
                console.log('- Key Decisions:', metadata.key_decisions.join('\n  - '));
            }
            if (metadata.code_changes) {
                console.log('- Code Changes:', metadata.code_changes.join('\n  - '));
            }
            if (metadata.files_created) {
                console.log('- Files:', metadata.files_created.join('\n  - '));
            }
        } catch (error) {
            console.error('❌ Failed to get memory:', error);
            process.exit(1);
        }
    });

program
    .command('search')
    .description('Search for similar memories using semantic search')
    .argument('<query>', 'The search query')
    .option('-l, --limit <number>', 'Number of results to return', '5')
    .action(async (query, options) => {
        try {
            const limit = parseInt(options.limit);
            const memories = await dbService.findSimilarMemories(query, limit);

            console.log('\n🔍 Search Results:\n');
            memories.forEach((memory: Memory) => {
                const metadata = JSON.parse(memory.metadata);
                console.log(`ID: ${memory.memory_id} (${memory.content_type}) - Similarity: ${((memory.similarity || 0) * 100).toFixed(1)}%`);
                console.log(`Content: ${memory.content}`);
                if (metadata.implementation_status) {
                    console.log(`Status: ${metadata.implementation_status}`);
                }
                if (metadata.key_decisions) {
                    console.log('Key Decisions:', metadata.key_decisions.join(', '));
                }
                console.log('---');
            });
        } catch (error) {
            console.error('❌ Failed to search memories:', error);
            process.exit(1);
        }
    });

program.parse(); 