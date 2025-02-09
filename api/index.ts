import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { app } from '../server';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Forward the request to our Express app
  return new Promise((resolve, reject) => {
    // Cast app to express.Application to access handle method
    (app as express.Application).handle(req, res, (err?: any) => {
      if (err) {
        return reject(err);
      }
      resolve(undefined);
    });
  });
}