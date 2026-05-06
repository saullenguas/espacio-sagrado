const Hero3D = ({ src, alt = "Espacio Sagrado Arcturus Melquizedec" }) => {
  if (!src) return null;

  return (
    <div className="flex justify-center items-center mb-6 perspective-[1200px]">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-[85%] max-w-[425px] h-auto animate-float3D drop-shadow-[0_0_20px_rgba(173,216,230,0.3)_0_0_40px_rgba(255,215,0,0.25)] rounded-lg transition-all duration-300 ease-out hover:scale-[1.03] hover:[transform:rotateY(6deg)_rotateX(3deg)] hover:drop-shadow-[0_0_30px_rgba(255,215,0,0.5)_0_0_60px_rgba(173,216,230,0.4)] cursor-pointer will-change-transform"
      />
    </div>
  );
};

export default Hero3D;