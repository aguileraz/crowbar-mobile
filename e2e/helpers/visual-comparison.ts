/**
 * Visual Comparison Helper
 * Compares screenshots with design prototypes
 */

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import sharp from 'sharp';

export interface ComparisonResult {
  match: number;
  diffPixels: number;
  totalPixels: number;
  passed: boolean;
  diffImagePath?: string;
}

export interface VisualConfig {
  threshold: number;
  ignoreAntialiasing: boolean;
  ignoreColors: boolean;
  alpha: number;
  diffColor: [number, number, number, number];
}

const DEFAULT_CONFIG: VisualConfig = {
  threshold: 0.05, // 5% difference allowed
  ignoreAntialiasing: true,
  ignoreColors: false,
  alpha: 0.1,
  diffColor: [255, 0, 0, 255], // Red for differences
};

export class VisualComparison {
  private config: VisualConfig;
  private prototypesPath: string;
  private resultsPath: string;
  
  constructor(
    prototypesPath = '/prototypes/OUT•Crowbar/_telas',
    resultsPath = '/results',
    config: Partial<VisualConfig> = {}
  ) {
    this.prototypesPath = prototypesPath;
    this.resultsPath = resultsPath;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Compare a screenshot with a prototype image
   */
  async compareWithPrototype(
    actualImagePath: string,
    prototypeFileName: string,
    outputName: string
  ): Promise<ComparisonResult> {
    const prototypePath = path.join(this.prototypesPath, prototypeFileName);
    
    // Check if files exist
    if (!fs.existsSync(actualImagePath)) {
      throw new Error(`Actual image not found: ${actualImagePath}`);
    }
    if (!fs.existsSync(prototypePath)) {
      throw new Error(`Prototype image not found: ${prototypePath}`);
    }
    
    // Load and resize images to same dimensions
    const { actual, prototype } = await this.prepareImages(actualImagePath, prototypePath);
    
    // Create diff image
    const diff = new PNG({ width: actual.width, height: actual.height });
    
    // Perform pixel comparison
    const diffPixels = pixelmatch(
      actual.data,
      prototype.data,
      diff.data,
      actual.width,
      actual.height,
      {
        threshold: this.config.threshold,
        includeAA: !this.config.ignoreAntialiasing,
        alpha: this.config.alpha,
        diffColor: this.config.diffColor,
        diffColorAlt: [0, 255, 0, 255], // Green for anti-aliasing
      }
    );
    
    // Calculate match percentage
    const totalPixels = actual.width * actual.height;
    const matchPercentage = ((totalPixels - diffPixels) / totalPixels) * 100;
    
    // Save diff image if there are differences
    let diffImagePath: string | undefined;
    if (diffPixels > 0) {
      diffImagePath = path.join(this.resultsPath, `diff-${outputName}.png`);
      fs.writeFileSync(diffImagePath, PNG.sync.write(diff));
      
      // Also create a comparison image with all three images side by side
      await this.createComparisonImage(
        actualImagePath,
        prototypePath,
        diffImagePath,
        outputName
      );
    }
    
    return {
      match: matchPercentage,
      diffPixels,
      totalPixels,
      passed: matchPercentage >= (100 - this.config.threshold * 100),
      diffImagePath,
    };
  }
  
  /**
   * Prepare images for comparison by resizing to same dimensions
   */
  private async prepareImages(actualPath: string, prototypePath: string) {
    // Read images
    const actualBuffer = fs.readFileSync(actualPath);
    const prototypeBuffer = fs.readFileSync(prototypePath);
    
    // Get dimensions
    const actualMeta = await sharp(actualBuffer).metadata();
    const prototypeMeta = await sharp(prototypeBuffer).metadata();
    
    // Determine target dimensions (use smaller dimensions)
    const targetWidth = Math.min(actualMeta.width!, prototypeMeta.width!);
    const targetHeight = Math.min(actualMeta.height!, prototypeMeta.height!);
    
    // Resize both images to target dimensions
    const actualResized = await sharp(actualBuffer)
      .resize(targetWidth, targetHeight, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();
    
    const prototypeResized = await sharp(prototypeBuffer)
      .resize(targetWidth, targetHeight, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();
    
    // Convert to PNG format for pixelmatch
    const actual = PNG.sync.read(actualResized);
    const prototype = PNG.sync.read(prototypeResized);
    
    return { actual, prototype };
  }
  
  /**
   * Create a comparison image with actual, expected, and diff side by side
   */
  private async createComparisonImage(
    actualPath: string,
    prototypePath: string,
    diffPath: string,
    outputName: string
  ) {
    const images = [actualPath, prototypePath, diffPath];
    const buffers = await Promise.all(
      images.map(img => sharp(img).resize(400, null, { fit: 'inside' }).png().toBuffer())
    );
    
    // Add labels to each image
    const labeledBuffers = await Promise.all([
      this.addLabel(buffers[0], 'Actual', '#4CAF50'),
      this.addLabel(buffers[1], 'Expected', '#2196F3'),
      this.addLabel(buffers[2], 'Difference', '#F44336'),
    ]);
    
    // Combine images horizontally
    const composite = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: labeledBuffers[0], left: 0, top: 50 },
        { input: labeledBuffers[1], left: 400, top: 50 },
        { input: labeledBuffers[2], left: 800, top: 50 },
      ])
      .png()
      .toBuffer();
    
    // Save comparison image
    const comparisonPath = path.join(this.resultsPath, `comparison-${outputName}.png`);
    fs.writeFileSync(comparisonPath, composite);
    
    return comparisonPath;
  }
  
  /**
   * Add a label to an image
   */
  private async addLabel(imageBuffer: Buffer, label: string, color: string) {
    const svg = `
      <svg width="400" height="50">
        <rect width="400" height="50" fill="${color}"/>
        <text x="200" y="35" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
          ${label}
        </text>
      </svg>
    `;
    
    const labelBuffer = Buffer.from(svg);
    
    return sharp({
      create: {
        width: 400,
        height: 450,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: labelBuffer, top: 0, left: 0 },
        { input: imageBuffer, top: 50, left: 0 },
      ])
      .png()
      .toBuffer();
  }
  
  /**
   * Generate a visual regression report
   */
  async generateReport(comparisons: Array<{
    screen: string;
    result: ComparisonResult;
  }>) {
    const report = {
      timestamp: new Date().toISOString(),
      apiLevel: process.env.API_LEVEL || 'unknown',
      deviceName: process.env.DEVICE_NAME || 'unknown',
      totalScreens: comparisons.length,
      passed: comparisons.filter(c => c.result.passed).length,
      failed: comparisons.filter(c => !c.result.passed).length,
      averageMatch: 
        comparisons.reduce((sum, c) => sum + c.result.match, 0) / comparisons.length,
      screens: comparisons.map(c => ({
        name: c.screen,
        match: c.result.match.toFixed(2) + '%',
        passed: c.result.passed,
        diffPixels: c.result.diffPixels,
        diffImage: c.result.diffImagePath,
      })),
    };
    
    // Save JSON report
    const reportPath = path.join(this.resultsPath, 'visual-regression-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(this.resultsPath, 'visual-regression-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    return report;
  }
  
  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Visual Regression Report - Crowbar Mobile</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    .header .subtitle {
      opacity: 0.9;
      font-size: 1.1em;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f8f9fa;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .summary-card .value {
      font-size: 2em;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }
    .summary-card .label {
      color: #666;
      font-size: 0.9em;
    }
    .screens {
      padding: 30px;
    }
    .screen-card {
      background: white;
      border-radius: 10px;
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .screen-header {
      padding: 20px;
      background: #f8f9fa;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .screen-title {
      font-size: 1.3em;
      font-weight: 600;
    }
    .badge {
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9em;
      font-weight: 600;
    }
    .badge.pass {
      background: #4caf50;
      color: white;
    }
    .badge.fail {
      background: #f44336;
      color: white;
    }
    .screen-details {
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }
    .detail-item {
      text-align: center;
    }
    .detail-value {
      font-size: 1.5em;
      font-weight: bold;
      color: #667eea;
    }
    .detail-label {
      color: #666;
      font-size: 0.9em;
      margin-top: 5px;
    }
    .comparison-image {
      width: 100%;
      padding: 20px;
      background: #f8f9fa;
    }
    .comparison-image img {
      width: 100%;
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📱 Visual Regression Report</h1>
      <div class="subtitle">Crowbar Mobile - ${new Date().toLocaleDateString()}</div>
    </div>
    
    <div class="summary">
      <div class="summary-card">
        <div class="value">${report.totalScreens}</div>
        <div class="label">Total Screens</div>
      </div>
      <div class="summary-card">
        <div class="value">${report.passed}</div>
        <div class="label">Passed</div>
      </div>
      <div class="summary-card">
        <div class="value">${report.failed}</div>
        <div class="label">Failed</div>
      </div>
      <div class="summary-card">
        <div class="value">${report.averageMatch.toFixed(1)}%</div>
        <div class="label">Average Match</div>
      </div>
    </div>
    
    <div class="screens">
      <h2 style="margin-bottom: 20px;">Screen Comparisons</h2>
      ${report.screens.map((screen: any) => `
        <div class="screen-card">
          <div class="screen-header">
            <div class="screen-title">${screen.name}</div>
            <div class="badge ${screen.passed ? 'pass' : 'fail'}">
              ${screen.passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>
          <div class="screen-details">
            <div class="detail-item">
              <div class="detail-value">${screen.match}</div>
              <div class="detail-label">Match</div>
            </div>
            <div class="detail-item">
              <div class="detail-value">${screen.diffPixels.toLocaleString()}</div>
              <div class="detail-label">Diff Pixels</div>
            </div>
          </div>
          ${screen.diffImage ? `
            <div class="comparison-image">
              <img src="comparison-${screen.name}.png" alt="Comparison">
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
    `;
  }
}

// Export singleton instance
export const visualComparison = new VisualComparison();