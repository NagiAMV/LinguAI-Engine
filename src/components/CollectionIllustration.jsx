import Image from 'next/image';

export default function CollectionIllustration({ resource }) {
  return <div className={`collection-illustration collection-illustration-${resource}`} aria-hidden="true"><Image src={`/illustrations/${resource}-clay-v1.png`} alt="" width={384} height={384} sizes="(max-width: 640px) 128px, (max-width: 1000px) 190px, 260px" priority /></div>;
}
