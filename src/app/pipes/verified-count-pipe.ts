

import { Pipe, PipeTransform } from '@angular/core';

interface Provider {
  isVerified?: boolean;
}

@Pipe({
  name: 'verifiedCount',
  standalone: true
})
export class VerifiedCountPipe implements PipeTransform {
  transform(providers: Provider[]): number {
    if (!providers || !Array.isArray(providers)) {
      return 0;
    }
    return providers.filter(p => p.isVerified === true).length;
  }
}