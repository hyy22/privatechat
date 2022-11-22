import { existsSync, mkdirSync } from 'fs';
import formidable from 'formidable';

export default async function(ctx) {
  if (!existsSync(ctx.config.upload.dir)) {
    mkdirSync(ctx.config.upload.dir);
  }
  const form = formidable({
    multiples: true,
    uploadDir: ctx.config.upload.dir,
    keepExtensions: true,
    maxFileSize: ctx.config.upload.maxFileSize,
    maxFiles: ctx.config.upload.maxFiles,
  });
  const { fields, files = [] } = await new Promise((resolve, reject) => {
    form.parse(ctx.req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({
        fields,
        files: Object.values(files).map(v => `${ctx.host}/${v.newFilename}`),
      });
    });
  });
  ctx.state.data = {
    fields, 
    files
  };
}