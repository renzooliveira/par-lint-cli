import { describe, it, expect } from 'vitest';
import { categorizeFile, categorizeFiles } from './categorizer.js';

describe('categorizeFile', () => {
  it('tags Angular component', () => {
    const result = categorizeFile('src/app/pages/home/home.component.ts');
    expect(result.tags).toContain('is_component');
    expect(result.tags).toContain('is_typescript');
    expect(result.tags).toContain('is_page');
  });

  it('tags service', () => {
    const result = categorizeFile('src/app/services/auth.service.ts');
    expect(result.tags).toContain('is_service');
    expect(result.tags).toContain('is_typescript');
  });

  it('tags template', () => {
    const result = categorizeFile('src/app/pages/home/home.component.html');
    expect(result.tags).toContain('is_template');
    expect(result.tags).toContain('is_html');
  });

  it('tags SCSS file', () => {
    const result = categorizeFile('src/app/pages/home/home.component.scss');
    expect(result.tags).toContain('is_style');
    expect(result.tags).toContain('is_scss');
  });

  it('tags entity', () => {
    const result = categorizeFile('src/domain/appointment.entity.ts');
    expect(result.tags).toContain('is_entity');
    expect(result.tags).toContain('is_typescript');
  });

  it('tags guard', () => {
    const result = categorizeFile('src/app/guards/auth.guard.ts');
    expect(result.tags).toContain('is_guard');
  });

  it('tags pipe', () => {
    const result = categorizeFile('src/app/pipes/date-format.pipe.ts');
    expect(result.tags).toContain('is_pipe');
  });
});

describe('categorizeFiles', () => {
  it('categorizes multiple files', () => {
    const files = [
      'src/app/app.component.ts',
      'src/app/app.component.html',
      'src/app/app.component.scss',
    ];
    const result = categorizeFiles(files);
    expect(result).toHaveLength(3);
    expect(result[0]!.tags).toContain('is_component');
    expect(result[1]!.tags).toContain('is_template');
    expect(result[2]!.tags).toContain('is_style');
  });
});
