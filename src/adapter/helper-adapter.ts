export class HelperAdapter {
  static fromFrontend(data: any) {
    return {
      dbKey: data.uiKey,
      uploadedSize: Number((data.uploadedSize / 1024 / 1024).toFixed(2)),
      // more conversions...
    };
  }
}
