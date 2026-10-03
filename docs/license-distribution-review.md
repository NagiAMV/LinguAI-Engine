# License distribution review

Reviewed: 2026-10-03. This records technical findings, not legal clearance.

## Verified project facts

- Root `LICENSE` is MIT, copyright 2026 NagiAMV. It has not been changed.
- Next.js 15.5.24 optionally depends on sharp 0.35.4 in the current lockfile.
- The 14 LGPL alerts refer to platform-specific sharp/libvips packages. They
  are not 14 separate application vulnerabilities or 14 installed platforms.
- On the inspected Windows x64 installation, `@img/sharp-win32-x64` contains
  libvips 8.18.6 DLLs. Its README lists additional bundled libraries, including
  LGPL components. Its LICENSE file alone contains Apache-2.0 and is not a
  complete notice/license bundle for all these native libraries.
- No direct `sharp` or `next/image` import was found in application source.
  This does not remove sharp from Next.js's dependency tree or distribution.
- No Dockerfile or existing third-party notice bundle was found.

## Choose the actual delivery model first

For server-hosted access, distinguish server-only binaries from JavaScript and
other assets delivered to browsers. Charging for access alone does not mean
customers receive the server binaries. Assess the actual deployed artifacts.

For a Docker image, installer, or application bundle delivered to customers:

1. Inventory the exact release artifact and target platform, including native
   bundled components; the Windows development installation is not evidence of
   what a Linux release contains.
2. Include applicable copyright notices and complete license texts, including
   GPLv3 and LGPLv3 where required. Preserve upstream notices.
3. Arrange the applicable corresponding-source delivery for covered libraries,
   with matching versions, modifications, and necessary build material. A link
   to a project's latest homepage is not by itself a completed source offer.
4. Verify the applicable relinking/replacement requirements and avoid terms
   that prohibit reverse engineering needed to debug modifications to covered
   libraries. Dynamic DLL files alone do not establish full compliance.
5. Review the final package and distribution terms before delivery. This
   document is preparation only, not a completed compliance bundle.

If the product policy is to exclude LGPL entirely, implement and test a real
dependency/distribution change. Do not delete license fields, suppress alerts
without review, or substitute a dummy sharp package. Disabling image
optimization alone does not remove the dependency from package-lock.json.

## References

- LGPLv3: https://www.gnu.org/licenses/lgpl-3.0.html (especially section 4)
- GNU FAQ: https://www.gnu.org/licenses/gpl-faq.en.html
- sharp installation: https://sharp.pixelplumbing.com/install/
- Native build provenance: https://github.com/lovell/sharp-libvips

## Pending decision

Confirm whether delivery is hosted access, customer-distributed binaries, or
both. No dependency removal, license change, or scanner exception has been
made on the basis of this review.
