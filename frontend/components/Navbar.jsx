import React, { useState, useEffect, useRef } from 'react';

const SafeJourney = ({ onGetStarted }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [activeFeature, setActiveFeature] = useState(0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeNav, setActiveNav] = useState('home');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [isMobile, setIsMobile] = useState(false);
    const sectionRefs = useRef([]);
    const featureRefs = useRef([]);

    const handleGetStartedClick = () => {
        if (onGetStarted) {
            onGetStarted();
        } else {
            // Fallback: scroll to contact or show alert
            const contactSection = document.getElementById('contact');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // Features data
    const features = [
        {
            icon: '🛡️',
            title: 'Military-Grade Security',
            description: 'Advanced encryption and real-time monitoring systems with 256-bit security',
            details: ['End-to-end encryption', 'Real-time threat detection', 'Secure data storage']
        },
        {
            icon: '🧭',
            title: 'Smart Route Planning',
            description: 'AI-powered safe routes based on live threat data and historical patterns',
            details: ['AI-powered routing', 'Live threat avoidance', 'Historical pattern analysis']
        },
        {
            icon: '🌍',
            title: 'Global Coverage',
            description: 'Comprehensive safety data across 150+ countries with local insights',
            details: ['150+ countries', 'Local safety insights', 'Regional threat alerts']
        },
        {
            icon: '🚨',
            title: 'Instant Alerts',
            description: 'Real-time notifications for threats, road closures, and safety concerns',
            details: ['Push notifications', 'SMS alerts', 'Email reports']
        },
        {
            icon: '📱',
            title: 'Mobile Friendly',
            description: 'Optimized for all devices with seamless cross-platform experience',
            details: ['Responsive design', 'Offline capabilities', 'Touch-optimized']
        },
        {
            icon: '⚡',
            title: 'Lightning Fast',
            description: 'Instant loading and real-time updates for critical safety information',
            details: ['Real-time updates', 'Quick loading', 'Instant notifications']
        }
    ];

    // Content sections with images
    const contentSections = [
        {
            title: "Real-Time Safety Monitoring",
            description: "Our advanced monitoring system keeps you protected with live threat detection and instant alerts. Stay informed about potential risks in your area with our comprehensive safety network.",
            features: ["Live threat detection", "Instant push notifications", "Area-specific alerts", "24/7 monitoring"],
            image: "📱",
            reverse: false
        },
        {
            title: "Intelligent Route Planning",
            description: "AI-powered route optimization that considers safety, traffic, and real-time incidents. Get the safest and most efficient routes tailored to your specific needs and preferences.",
            features: ["AI-powered routing", "Safety-first approach", "Real-time adjustments", "Multiple route options"],
            image: "🗺️",
            reverse: true
        },
        {
            title: "Global Coverage & Local Insights",
            description: "Access comprehensive safety data across 150+ countries with localized threat intelligence. Our global network ensures you're protected wherever your journey takes you.",
            features: ["150+ countries", "Local safety data", "Cultural insights", "Regional expertise"],
            image: "🌍",
            reverse: false
        }
    ];

    // Carousel images
    const carouselImages = [
        {
            id: 1,
            title: "Mobile App Interface",
            description: "Clean and intuitive mobile interface for easy navigation",
            type: "mobile"
        },
        {
            id: 2,
            title: "Safety Dashboard",
            description: "Comprehensive dashboard showing real-time safety metrics",
            type: "dashboard"
        },
        {
            id: 3,
            title: "Route Planning",
            description: "Smart route planning with safety considerations",
            type: "map"
        },
        {
            id: 4,
            title: "Alert System",
            description: "Instant notifications for critical safety updates",
            type: "alerts"
        }
    ];

    // Updated Color schemes for both modes - Purple/Blue theme
    const colors = {
        dark: {
            bg: '#15022cff', // Deep purple
            bgSecondary: '#1a0338ff', // Slightly lighter purple
            bgTertiary: '#200545ff', // Even lighter purple
            text: '#ffffff',
            textSecondary: '#b8b8d0ff',
            textTertiary: '#8a8aa5ff',
            accent: '#6366f1ff', // Indigo accent
            accentHover: '#818cf8ff', // Lighter indigo
            accentLight: '#a5b4fcff',
            accentYellow: '#c7d2feff',
            timelineLine: '#6366f1ff',
            border: '#2d1b69ff',
            borderLight: '#3c2a84ff',
            cardBg: 'rgba(30, 15, 60, 0.8)',
            cardHover: 'rgba(40, 25, 80, 0.9)',
            shadow: 'rgba(99, 102, 241, 0.15)',
            shadowHover: 'rgba(99, 102, 241, 0.25)',
            mapOverlay: 'rgba(21, 2, 44, 0.7)',
            mapGlow: 'rgba(99, 102, 241, 0.1)'
        },
        light: {
            bg: '#f8faffff', // Very light purple/blue
            bgSecondary: '#f0f4ffff',
            bgTertiary: '#e8edffff',
            text: '#1e1b4bff', // Deep indigo
            textSecondary: '#4f46e5ff',
            textTertiary: '#6366f1ff',
            accent: '#4f46e5ff', // Indigo accent
            accentHover: '#6366f1ff',
            accentLight: '#818cf8ff',
            accentYellow: '#fbbf24',
            timelineLine: '#4f46e5ff',
            border: '#c7d2feff',
            borderLight: '#e0e7ffff',
            cardBg: 'rgba(255, 255, 255, 0.9)',
            cardHover: 'rgba(248, 250, 255, 0.95)',
            shadow: 'rgba(79, 70, 229, 0.1)',
            shadowHover: 'rgba(79, 70, 229, 0.15)',
            mapOverlay: 'rgba(248, 250, 255, 0.7)',
            mapGlow: 'rgba(79, 70, 229, 0.1)'
        }
    };

    const currentColors = isDarkMode ? colors.dark : colors.light;

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            setScrollProgress(progress);

            setIsScrolled(scrollTop > 50);

            // Update active nav based on scroll position
            const sections = ['home', 'features', 'showcase', 'contact'];
            let current = 'home';
            
            sections.forEach(section => {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 100 && rect.bottom >= 100) {
                        current = section;
                    }
                }
            });
            
            setActiveNav(current);

            // Update active feature based on scroll position - FIXED
            const featuresSection = document.getElementById('features');
            if (featuresSection) {
                const sectionTop = featuresSection.offsetTop - 100;
                const sectionHeight = featuresSection.offsetHeight;
                const scrollPosition = scrollTop - sectionTop;

                if (scrollPosition >= 0 && scrollPosition <= sectionHeight) {
                    const featureHeight = sectionHeight / features.length;
                    const featureIndex = Math.min(
                        Math.floor(scrollPosition / featureHeight),
                        features.length - 1
                    );
                    setActiveFeature(featureIndex);
                }
            }

            // Scroll animations
            sectionRefs.current.forEach((section) => {
                if (section) {
                    const elementTop = section.getBoundingClientRect().top;
                    if (elementTop < window.innerHeight - 100) {
                        section.style.opacity = '1';
                        section.style.transform = 'translateY(0)';
                    }
                }
            });
        };

        const loadingTimer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        // Auto carousel
        const carouselInterval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
        }, 4000);

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => {
            clearTimeout(loadingTimer);
            clearInterval(carouselInterval);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [features.length, carouselImages.length]);

    const addToRefs = (el) => {
        if (el && !sectionRefs.current.includes(el)) {
            sectionRefs.current.push(el);
        }
    };

    const addToFeatureRefs = (el) => {
        if (el && !featureRefs.current.includes(el)) {
            featureRefs.current.push(el);
        }
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        alert('Thank you for your message! We will get back to you soon.');
        setFormData({ name: '', email: '', message: '' });
    };

    const handleNavClick = () => {
        setIsMenuOpen(false);
    };

    // Loading Component
    if (isLoading) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: currentColors.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: `3px solid ${currentColors.accent}`,
                    borderTop: '3px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '20px'
                    }}>🗺️</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: currentColors.accent, marginBottom: '8px', fontSize: '24px' }}>SafeJourney</h3>
                    <p style={{ color: currentColors.textSecondary, fontSize: '16px' }}>Loading your safety companion...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: currentColors.bg,
            color: currentColors.text,
            minHeight: '100vh',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            position: 'relative'
        }}>

            {/* Background Pattern */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: isDarkMode
                    ? `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%236366f1' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`
                    : `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%234f46e5' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(8px)',
                opacity: 0.3,
                zIndex: -1
            }}></div>

            {/* Scroll Progress Bar */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: `${scrollProgress}%`,
                height: '3px',
                backgroundColor: currentColors.accent,
                zIndex: 1001,
                transition: 'width 0.1s ease',
                boxShadow: `0 0 10px ${currentColors.accent}`
            }}></div>

            {/* Navigation */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: 1000,
                padding: '15px 0',
                transition: 'all 0.3s ease',
                backdropFilter: isScrolled ? 'blur(20px)' : 'none',
                backgroundImage: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(88, 28, 135, 0.95) 0%, rgba(109, 40, 217, 0.95) 50%, rgba(79, 70, 229, 0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(233, 213, 255, 0.98) 0%, rgba(196, 181, 253, 0.98) 50%, rgba(221, 214, 254, 0.98) 100%)',
                borderBottom: isScrolled ? `1px solid ${isDarkMode ? 'rgba(147, 51, 234, 0.3)' : 'rgba(196, 181, 253, 0.5)'}` : 'none'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>

                    {/* Logo */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        textDecoration: 'none',
                        zIndex: 1002
                    }}>
                        <div style={{
                            width: '35px',
                            height: '35px',
                            backgroundColor: currentColors.accent,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            fontSize: '14px',
                            boxShadow: `0 4px 15px ${currentColors.shadow}`,
                            overflow: 'hidden'
                        }}>
                            <img
                                src="/logo.png"
                                alt="SafeJourney Logo"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                        e.target.nextSibling.style.display = 'block';
                                    }
                                }}
                            />
                            <div style={{ display: 'none', fontSize: '16px' }}>🗺️</div>
                        </div>
                        <span style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: isDarkMode ? '#e9d5ff' : '#000000'
                        }}>
                            SafeJourney
                        </span>
                    </div>

                    {/* Desktop Navigation - Hidden on Mobile */}
                    {!isMobile && (
                        <nav style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '24px'
                        }}>
                            {[
                                { name: 'Home', id: 'home' },
                                { name: 'Features', id: 'features' },
                                { name: 'Showcase', id: 'showcase' },
                                { name: 'Contact', id: 'contact' }
                            ].map((item) => (
                                <a 
                                    key={item.id} 
                                    href={`#${item.id}`} 
                                    className="nav-link"
                                    style={{
                                        color: activeNav === item.id 
                                            ? (isDarkMode ? '#e9d5ff' : '#000000') 
                                            : (isDarkMode ? '#c4b5fd' : '#000000'),
                                        textDecoration: 'none',
                                        fontSize: '15px',
                                        fontWeight: '500',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        backgroundColor: 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        const span = e.currentTarget.querySelector('.underline-yellow');
                                        if (span && activeNav !== item.id) {
                                            span.style.width = '100%';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        const span = e.currentTarget.querySelector('.underline-yellow');
                                        if (span && activeNav !== item.id) {
                                            span.style.width = '0';
                                        }
                                    }}
                                >
                                    {item.name}
                                    <span 
                                        className={`underline-yellow absolute bottom-2 left-4 h-0.5 bg-yellow-400 transition-all duration-300 ${
                                            activeNav === item.id ? 'w-[calc(100%-32px)]' : 'w-0'
                                        }`}
                                        style={{
                                            width: activeNav === item.id ? 'calc(100% - 32px)' : '0'
                                        }}
                                    ></span>
                                </a>
                            ))}

                            {/* Theme Toggle */}
                            <button onClick={() => setIsDarkMode(!isDarkMode)} style={{
                                background: 'none',
                                border: 'none',
                                color: isDarkMode ? '#c4b5fd' : '#000000',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                transition: 'all 0.3s ease',
                                position: 'relative'
                            }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = isDarkMode ? '#e9d5ff' : '#000000';
                                    const underline = e.target.querySelector('.underline-yellow');
                                    if (underline) underline.style.width = '100%';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = isDarkMode ? '#c4b5fd' : '#000000';
                                    const underline = e.target.querySelector('.underline-yellow');
                                    if (underline) underline.style.width = '0';
                                }}
                            >
                                {isDarkMode ? '☀️' : '🌙'}
                                <span className="underline-yellow absolute bottom-0 left-0 h-0.5 bg-yellow-400 transition-all duration-300 w-0"></span>
                            </button>

                            <button onClick={handleGetStartedClick} style={{
                                backgroundColor: currentColors.accent,
                                color: '#ffffff',
                                border: 'none',
                                padding: '8px 20px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: `0 4px 15px ${currentColors.shadow}`
                            }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = currentColors.accentHover;
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = `0 8px 25px ${currentColors.shadowHover}`;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = currentColors.accent;
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = `0 4px 15px ${currentColors.shadow}`;
                                }}
                            >
                                Get Started
                            </button>
                        </nav>
                    )}

                    {/* Mobile Menu Button - Visible only on Mobile */}
                    {isMobile && (
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '6px',
                                transition: 'all 0.3s ease',
                                flexDirection: 'column',
                                gap: '4px',
                                width: '30px',
                                height: '30px',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 1002,
                                display: 'flex'
                            }}
                        >
                            <div style={{
                                width: '20px',
                                height: '2px',
                                backgroundColor: currentColors.text,
                                transition: 'all 0.3s ease',
                                transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
                            }}></div>
                            <div style={{
                                width: '20px',
                                height: '2px',
                                backgroundColor: currentColors.text,
                                transition: 'all 0.3s ease',
                                opacity: isMenuOpen ? 0 : 1
                            }}></div>
                            <div style={{
                                width: '20px',
                                height: '2px',
                                backgroundColor: currentColors.text,
                                transition: 'all 0.3s ease',
                                transform: isMenuOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none'
                            }}></div>
                        </button>
                    )}
                </div>

                {/* Mobile Menu - Slides in from top */}
                {isMobile && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100vh',
                        backgroundColor: isDarkMode ? 'rgba(21, 2, 44, 0.98)' : 'rgba(248, 250, 255, 0.98)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '30px',
                        transform: isMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
                        opacity: isMenuOpen ? 1 : 0,
                        transition: 'all 0.4s ease',
                        zIndex: 1001,
                        padding: '20px'
                    }}>
                        {[
                            { name: 'Home', id: 'home' },
                            { name: 'Features', id: 'features' },
                            { name: 'App Showcase', id: 'showcase' },
                            { name: 'Contact', id: 'contact' }
                        ].map((item) => (
                            <a 
                                key={item.id} 
                                href={`#${item.id}`} 
                                style={{
                                    color: activeNav === item.id ? currentColors.accent : currentColors.text,
                                    textDecoration: 'none',
                                    padding: '16px 24px',
                                    borderRadius: '12px',
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: activeNav === item.id ?
                                        (isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.1)') : 'transparent',
                                    width: '200px',
                                    textAlign: 'center'
                                }}
                                onClick={handleNavClick}
                            >
                                {item.name}
                            </a>
                        ))}
                        
                        {/* Mobile Theme Toggle and Get Started */}
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            marginTop: '20px',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <button onClick={() => setIsDarkMode(!isDarkMode)} style={{
                                background: 'none',
                                border: `2px solid ${currentColors.accent}`,
                                color: currentColors.accent,
                                cursor: 'pointer',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                width: '200px'
                            }}>
                                {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                            </button>
                            
                            <button onClick={handleGetStartedClick} style={{
                                backgroundColor: currentColors.accent,
                                color: '#ffffff',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                width: '200px'
                            }}>
                                Get Started
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section id="home" style={{
                height: '100vh',
                minHeight: '600px',
                background: isDarkMode
                    ? 'linear-gradient(135deg, rgba(21, 2, 44, 0.9) 0%, rgba(26, 3, 56, 0.95) 50%, rgba(32, 5, 69, 0.9) 100%)'
                    : 'linear-gradient(135deg, rgba(248, 250, 255, 0.9) 0%, rgba(240, 244, 255, 0.95) 50%, rgba(232, 237, 255, 0.9) 100%)',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                padding: '80px 0 40px'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '40px',
                    width: '100%',
                    flexDirection: isMobile ? 'column' : 'row',
                    textAlign: isMobile ? 'center' : 'left'
                }}>

                    {/* Hero Content */}
                    <div style={{ 
                        flex: 1,
                        padding: isMobile ? '0 10px' : '0'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            backgroundColor: currentColors.accent,
                            color: '#ffffff',
                            padding: '6px 16px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            boxShadow: `0 4px 15px ${currentColors.shadow}`
                        }}>
                            REAL-TIME SAFETY MONITORING
                        </div>

                        <h1 style={{
                            fontSize: isMobile ? '2rem' : '3.5rem',
                            fontWeight: '800',
                            lineHeight: '1.1',
                            marginBottom: '20px',
                            color: currentColors.text
                        }}>
                            Your Journey , <span style={{ color: currentColors.accent }}>Our Safety</span>
                        </h1>

                        <p style={{
                            fontSize: isMobile ? '1rem' : '1.125rem',
                            lineHeight: '1.6',
                            color: currentColors.textSecondary,
                            marginBottom: '32px',
                            maxWidth: '500px',
                            marginLeft: isMobile ? 'auto' : '0',
                            marginRight: isMobile ? 'auto' : '0'
                        }}>
                            Advanced risk management platform that transforms your travel experience with real-time threat detection, intelligent routing, and proactive safety alerts.
                        </p>

                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            flexWrap: 'wrap',
                            justifyContent: isMobile ? 'center' : 'flex-start'
                        }}>
                            <button onClick={handleGetStartedClick} style={{
                                backgroundColor: currentColors.accent,
                                color: '#ffffff',
                                border: 'none',
                                padding: '14px 28px',
                                borderRadius: '10px',
                                fontSize: '15px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: `0 8px 25px ${currentColors.shadow}`
                            }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = currentColors.accentHover;
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = `0 12px 30px ${currentColors.shadowHover}`;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = currentColors.accent;
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = `0 8px 25px ${currentColors.shadow}`;
                                }}
                            >
                                Get Started →
                            </button>
                        </div>
                    </div>

                    {/* Hero Visual */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: isMobile ? '20px 0' : '0'
                    }}>
                        <div style={{
                            width: '100%',
                            maxWidth: isMobile ? '300px' : '400px',
                            height: isMobile ? '250px' : '300px',
                            backgroundColor: 'transparent',
                            border: `1px solid ${currentColors.border}`,
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            boxShadow: `0 20px 40px ${currentColors.shadow}`,
                            overflow: 'hidden'
                        }}>
                            <img
                                src="./logo.png"
                                alt="SafeJourney App Preview"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    backgroundColor: 'transparent',
                                    borderRadius: '16px'
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div style={{
                                display: 'none',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                padding: '20px'
                            }}>
                                <div style={{
                                    fontSize: isMobile ? '48px' : '64px',
                                    marginBottom: '16px'
                                }}>🗺️</div>
                                <div style={{
                                    fontWeight: '700',
                                    fontSize: isMobile ? '18px' : '20px',
                                    marginBottom: '8px'
                                }}>
                                    Interactive Safety Map
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section with PROPER Timeline */}
            <section id="features" style={{
                padding: isMobile ? '60px 0' : '100px 0',
                backgroundColor: currentColors.bgSecondary,
                position: 'relative',
                minHeight: '100vh'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px',
                    position: 'relative'
                }}>
                    <div style={{
                        textAlign: 'center',
                        marginBottom: isMobile ? '40px' : '80px'
                    }}>
                        <h2 style={{
                            fontSize: isMobile ? '2rem' : '2.5rem',
                            fontWeight: '700',
                            marginBottom: '16px',
                            color: currentColors.text
                        }}>
                            Our <span style={{ color: currentColors.accent }}>Features</span>
                        </h2>
                        <p style={{
                            fontSize: isMobile ? '1rem' : '1.125rem',
                            color: currentColors.textSecondary,
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            Discover the powerful features that make SafeJourney your ultimate travel companion
                        </p>
                    </div>

                    {/* Mobile Features Layout */}
                    {isMobile ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '30px'
                        }}>
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    style={{
                                        backgroundColor: currentColors.cardBg,
                                        padding: '24px',
                                        borderRadius: '16px',
                                        border: `2px solid ${index === activeFeature ? currentColors.accent : currentColors.border}`,
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: `0 10px 30px ${currentColors.shadow}`,
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-5px)';
                                        e.target.style.boxShadow = `0 15px 40px ${currentColors.shadowHover}`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = `0 10px 30px ${currentColors.shadow}`;
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{
                                            fontSize: '40px'
                                        }}>
                                            {feature.icon}
                                        </div>
                                        <h3 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: '600',
                                            color: currentColors.text,
                                            margin: 0
                                        }}>
                                            {feature.title}
                                        </h3>
                                    </div>
                                    <p style={{
                                        color: currentColors.textSecondary,
                                        marginBottom: '16px',
                                        lineHeight: '1.6',
                                        fontSize: '0.95rem'
                                    }}>
                                        {feature.description}
                                    </p>
                                    <ul style={{
                                        listStyle: 'none',
                                        padding: 0,
                                        margin: 0,
                                        display: 'grid',
                                        gap: '8px'
                                    }}>
                                        {feature.details.map((detail, idx) => (
                                            <li key={idx} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                color: currentColors.textSecondary,
                                                fontSize: '14px'
                                            }}>
                                                <span style={{
                                                    color: currentColors.accent,
                                                    fontWeight: 'bold'
                                                }}>✓</span>
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Desktop Timeline Layout - FIXED */
                        <div style={{
                            display: 'flex',
                            position: 'relative',
                            maxWidth: '1000px',
                            margin: '0 auto',
                            minHeight: '600px'
                        }}>
                            {/* Left Vertical Timeline */}
                            <div style={{
                                position: 'relative',
                                width: '100px',
                                flexShrink: 0
                            }}>
                                {/* Vertical Line */}
                                <div style={{
                                    position: 'absolute',
                                    left: '40px',
                                    top: '0',
                                    bottom: '0',
                                    width: '4px',
                                    backgroundColor: currentColors.timelineLine,
                                    zIndex: 1,
                                    borderRadius: '2px'
                                }}>
                                    {/* Animated Progress Line - NOW WORKING */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '0',
                                        left: '0',
                                        width: '100%',
                                        height: `${(activeFeature / (features.length - 1)) * 100}%`,
                                        backgroundColor: currentColors.accent,
                                        transition: 'height 0.5s ease',
                                        borderRadius: '2px',
                                        boxShadow: `0 0 10px ${currentColors.accent}`
                                    }}></div>
                                </div>

                                {/* Timeline Nodes */}
                                {features.map((_, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            position: 'absolute',
                                            left: '30px',
                                            top: `${(index / (features.length - 1)) * 100}%`,
                                            transform: 'translateY(-50%)',
                                            zIndex: 2,
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            backgroundColor: index <= activeFeature ? 
                                                (index === activeFeature ? currentColors.accentYellow : currentColors.accent) : 
                                                currentColors.timelineLine,
                                            borderRadius: '50%',
                                            border: `3px solid ${currentColors.bgSecondary}`,
                                            boxShadow: index === activeFeature ? `0 0 20px ${currentColors.accentYellow}` : 
                                                        (index <= activeFeature ? `0 0 15px ${currentColors.accent}` : 'none'),
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                            onMouseEnter={() => setActiveFeature(index)}
                                        ></div>
                                    </div>
                                ))}
                            </div>

                            {/* Features Content */}
                            <div style={{
                                flex: 1,
                                paddingLeft: '60px'
                            }}>
                                {features.map((feature, index) => (
                                    <div
                                        key={index}
                                        ref={addToFeatureRefs}
                                        style={{
                                            marginBottom: '80px',
                                            opacity: index === activeFeature ? 1 : 0.5,
                                            transform: index === activeFeature ? 'translateX(0)' : 'translateX(20px)',
                                            transition: 'all 0.5s ease',
                                            minHeight: '200px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        onMouseEnter={() => setActiveFeature(index)}
                                    >
                                        <div style={{
                                            backgroundColor: currentColors.cardBg,
                                            padding: '32px',
                                            borderRadius: '16px',
                                            border: `2px solid ${index === activeFeature ? currentColors.accent : currentColors.border}`,
                                            transition: 'all 0.3s ease',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: index === activeFeature ? `0 20px 40px ${currentColors.shadowHover}` : 'none',
                                            transform: index === activeFeature ? 'translateY(-5px)' : 'none',
                                            width: '100%'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '20px',
                                                marginBottom: '20px'
                                            }}>
                                                <div style={{
                                                    fontSize: '48px',
                                                    filter: index === activeFeature ? 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.3))' : 'none',
                                                    transition: 'all 0.3s ease'
                                                }}>
                                                    {feature.icon}
                                                </div>
                                                <h3 style={{
                                                    fontSize: '1.5rem',
                                                    fontWeight: '600',
                                                    color: currentColors.text,
                                                    margin: 0
                                                }}>
                                                    {feature.title}
                                                </h3>
                                            </div>
                                            <p style={{
                                                color: currentColors.textSecondary,
                                                marginBottom: '20px',
                                                lineHeight: '1.6',
                                                fontSize: '1.1rem'
                                            }}>
                                                {feature.description}
                                            </p>
                                            <ul style={{
                                                listStyle: 'none',
                                                padding: 0,
                                                margin: 0,
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                                gap: '10px'
                                            }}>
                                                {feature.details.map((detail, idx) => (
                                                    <li key={idx} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        color: currentColors.textSecondary,
                                                        fontSize: '14px'
                                                    }}>
                                                        <span style={{
                                                            color: currentColors.accent,
                                                            fontWeight: 'bold'
                                                        }}>✓</span>
                                                        {detail}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Rest of the sections remain the same as before */}
            {/* App Showcase Section */}
            <section id="showcase" style={{
                padding: isMobile ? '60px 0' : '100px 0',
                backgroundColor: currentColors.bgTertiary
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px'
                }}>
                    {/* Image Carousel Section */}
                    <div style={{
                        marginBottom: isMobile ? '60px' : '100px'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            marginBottom: isMobile ? '40px' : '60px'
                        }}>
                            <h2 style={{
                                fontSize: isMobile ? '2rem' : '2.5rem',
                                fontWeight: '700',
                                marginBottom: '16px',
                                color: currentColors.text
                            }}>
                                App <span style={{ color: currentColors.accent }}>Showcase</span>
                            </h2>
                            <p style={{
                                fontSize: isMobile ? '1rem' : '1.125rem',
                                color: currentColors.textSecondary,
                                maxWidth: '600px',
                                margin: '0 auto'
                            }}>
                                Explore our intuitive interface and powerful features
                            </p>
                        </div>

                        {/* Carousel Container */}
                        <div style={{
                            position: 'relative',
                            maxWidth: isMobile ? '100%' : '800px',
                            margin: '0 auto',
                            height: isMobile ? '400px' : '500px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: `0 20px 40px ${currentColors.shadow}`
                        }}>
                            {/* Carousel Slides */}
                            {carouselImages.map((image, index) => (
                                <div
                                    key={image.id}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        opacity: index === currentSlide ? 1 : 0,
                                        transition: 'opacity 0.5s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: currentColors.cardBg,
                                        padding: isMobile ? '20px' : '40px'
                                    }}
                                >
                                    {/* Mobile Device Frame */}
                                    <div style={{
                                        width: isMobile ? '200px' : '300px',
                                        height: isMobile ? '400px' : '600px',
                                        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                                        borderRadius: isMobile ? '30px' : '40px',
                                        border: `10px solid ${isDarkMode ? '#2a2a2a' : '#e5e7eb'}`,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: `0 15px 30px ${currentColors.shadow}`
                                    }}>
                                        {/* Mobile Screen Content */}
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '16px'
                                        }}>
                                            <div style={{
                                                fontSize: isMobile ? '36px' : '48px',
                                                marginBottom: '16px'
                                            }}>
                                                {image.type === 'mobile' ? '📱' : 
                                                 image.type === 'dashboard' ? '📊' :
                                                 image.type === 'map' ? '🗺️' : '🚨'}
                                            </div>
                                            <h3 style={{
                                                fontSize: isMobile ? '16px' : '20px',
                                                fontWeight: '600',
                                                color: isDarkMode ? '#ffffff' : '#000000',
                                                marginBottom: '8px',
                                                textAlign: 'center'
                                            }}>
                                                {image.title}
                                            </h3>
                                            <p style={{
                                                color: isDarkMode ? '#a0a0a0' : '#6b7280',
                                                textAlign: 'center',
                                                fontSize: isMobile ? '12px' : '14px'
                                            }}>
                                                {image.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Carousel Controls */}
                            <button
                                onClick={prevSlide}
                                style={{
                                    position: 'absolute',
                                    left: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    backgroundColor: currentColors.cardBg,
                                    border: `2px solid ${currentColors.border}`,
                                    borderRadius: '50%',
                                    width: isMobile ? '40px' : '50px',
                                    height: isMobile ? '40px' : '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: isMobile ? '16px' : '20px',
                                    transition: 'all 0.3s ease',
                                    color: currentColors.text
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = currentColors.accent;
                                    e.target.style.color = '#ffffff';
                                    e.target.style.borderColor = currentColors.accent;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = currentColors.cardBg;
                                    e.target.style.color = currentColors.text;
                                    e.target.style.borderColor = currentColors.border;
                                }}
                            >
                                ‹
                            </button>
                            <button
                                onClick={nextSlide}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    backgroundColor: currentColors.cardBg,
                                    border: `2px solid ${currentColors.border}`,
                                    borderRadius: '50%',
                                    width: isMobile ? '40px' : '50px',
                                    height: isMobile ? '40px' : '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: isMobile ? '16px' : '20px',
                                    transition: 'all 0.3s ease',
                                    color: currentColors.text
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = currentColors.accent;
                                    e.target.style.color = '#ffffff';
                                    e.target.style.borderColor = currentColors.accent;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = currentColors.cardBg;
                                    e.target.style.color = currentColors.text;
                                    e.target.style.borderColor = currentColors.border;
                                }}
                            >
                                ›
                            </button>

                            {/* Carousel Indicators */}
                            <div style={{
                                position: 'absolute',
                                bottom: '15px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: '8px'
                            }}>
                                {carouselImages.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            border: 'none',
                                            backgroundColor: index === currentSlide ? currentColors.accent : currentColors.border,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    ></button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Alternating Content Sections */}
                    {contentSections.map((section, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: isMobile ? '30px' : '60px',
                                marginBottom: isMobile ? '60px' : '100px',
                                flexDirection: isMobile ? 'column' : (section.reverse ? 'row-reverse' : 'row'),
                            }}
                            ref={addToRefs}
                        >
                            {/* Image Side */}
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                justifyContent: 'center'
                            }}>
                                <div style={{
                                    width: isMobile ? '250px' : '300px',
                                    height: isMobile ? '500px' : '600px',
                                    backgroundColor: currentColors.cardBg,
                                    borderRadius: '16px',
                                    border: `1px solid ${currentColors.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: isMobile ? '60px' : '80px',
                                    boxShadow: `0 15px 30px ${currentColors.shadow}`,
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-5px)';
                                    e.target.style.boxShadow = `0 20px 40px ${currentColors.shadowHover}`;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = `0 15px 30px ${currentColors.shadow}`;
                                }}
                                >
                                    {section.image}
                                </div>
                            </div>

                            {/* Content Side */}
                            <div style={{
                                flex: 1,
                                padding: isMobile ? '0' : (section.reverse ? '0 40px 0 0' : '0 0 0 40px'),
                                textAlign: isMobile ? 'center' : 'left'
                            }}>
                                <h3 style={{
                                    fontSize: isMobile ? '1.5rem' : '2rem',
                                    fontWeight: '700',
                                    marginBottom: '16px',
                                    color: currentColors.text
                                }}>
                                    {section.title}
                                </h3>
                                <p style={{
                                    fontSize: isMobile ? '1rem' : '1.125rem',
                                    lineHeight: '1.6',
                                    color: currentColors.textSecondary,
                                    marginBottom: '24px'
                                }}>
                                    {section.description}
                                </p>
                                <ul style={{
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0,
                                    display: 'grid',
                                    gap: '12px'
                                }}>
                                    {section.features.map((feature, idx) => (
                                        <li key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            color: currentColors.text,
                                            fontSize: isMobile ? '0.9rem' : '1rem',
                                            justifyContent: isMobile ? 'center' : 'flex-start'
                                        }}>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                backgroundColor: currentColors.accent,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px',
                                                color: '#ffffff',
                                                flexShrink: 0
                                            }}>
                                                ✓
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" style={{
                padding: isMobile ? '60px 0' : '100px 0',
                backgroundColor: currentColors.bgTertiary
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px'
                }}>
                    <div style={{
                        textAlign: 'center',
                        marginBottom: isMobile ? '40px' : '60px'
                    }}>
                        <h2 style={{
                            fontSize: isMobile ? '2rem' : '2.5rem',
                            fontWeight: '700',
                            marginBottom: '16px',
                            color: currentColors.text
                        }}>
                            Get In <span style={{ color: currentColors.accent }}>Touch</span>
                        </h2>
                        <p style={{
                            fontSize: isMobile ? '1rem' : '1.125rem',
                            color: currentColors.textSecondary,
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            Have questions or need support? We're here to help you stay safe on your journey.
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: isMobile ? '40px' : '60px',
                        alignItems: 'center',
                        flexDirection: isMobile ? 'column' : 'row'
                    }}>
                        {/* Contact Form */}
                        <div style={{
                            flex: 1,
                            backgroundColor: currentColors.cardBg,
                            padding: isMobile ? '24px' : '40px',
                            borderRadius: '16px',
                            border: `1px solid ${currentColors.border}`,
                            backdropFilter: 'blur(10px)',
                            boxShadow: `0 15px 30px ${currentColors.shadow}`,
                            width: '100%'
                        }}>
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: currentColors.text,
                                        fontSize: isMobile ? '14px' : '16px'
                                    }}>
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: `1px solid ${currentColors.border}`,
                                            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                                            color: currentColors.text,
                                            fontSize: '14px',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = currentColors.accent;
                                            e.target.style.boxShadow = `0 0 0 3px ${currentColors.accent}20`;
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = currentColors.border;
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: currentColors.text,
                                        fontSize: isMobile ? '14px' : '16px'
                                    }}>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: `1px solid ${currentColors.border}`,
                                            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                                            color: currentColors.text,
                                            fontSize: '14px',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = currentColors.accent;
                                            e.target.style.boxShadow = `0 0 0 3px ${currentColors.accent}20`;
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = currentColors.border;
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: currentColors.text,
                                        fontSize: isMobile ? '14px' : '16px'
                                    }}>
                                        Message
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                        rows="4"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: `1px solid ${currentColors.border}`,
                                            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                                            color: currentColors.text,
                                            fontSize: '14px',
                                            resize: 'vertical',
                                            transition: 'all 0.3s ease',
                                            fontFamily: 'inherit'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = currentColors.accent;
                                            e.target.style.boxShadow = `0 0 0 3px ${currentColors.accent}20`;
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = currentColors.border;
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    style={{
                                        width: '100%',
                                        backgroundColor: currentColors.accent,
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '14px 28px',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: `0 4px 15px ${currentColors.shadow}`
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = currentColors.accentHover;
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = `0 8px 25px ${currentColors.shadowHover}`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = currentColors.accent;
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = `0 4px 15px ${currentColors.shadow}`;
                                    }}
                                >
                                    Send Message
                                </button>
                            </form>
                        </div>

                        {/* Contact Image/Info */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%'
                        }}>
                            <div style={{
                                width: '100%',
                                maxWidth: isMobile ? '300px' : '400px',
                                height: isMobile ? '300px' : '400px',
                                backgroundImage: `url(/contactform.png)`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                backgroundColor: 'transparent',
                                border: 'none',
                                boxShadow: 'none',
                                borderRadius: '0px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                backgroundColor: isDarkMode ? '#0f0120' : '#1e1b4b',
                color: '#ffffff',
                padding: '40px 0 20px'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '30px',
                        marginBottom: '30px'
                    }}>
                        {/* Company Info */}
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    width: '35px',
                                    height: '35px',
                                    backgroundColor: currentColors.accent,
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    color: '#ffffff',
                                    fontSize: '14px'
                                }}>
                                    🗺️
                                </div>
                                <span style={{
                                    fontSize: '18px',
                                    fontWeight: '700'
                                }}>
                                    SafeJourney
                                </span>
                            </div>
                            <p style={{
                                color: '#b8b8d0',
                                lineHeight: '1.6',
                                marginBottom: '16px',
                                fontSize: '14px'
                            }}>
                                Your trusted companion for safe and secure travels worldwide. Real-time alerts, intelligent routing, and comprehensive safety monitoring.
                            </p>
                            <div style={{
                                display: 'flex',
                                gap: '12px'
                            }}>
                                {['📘', '📷', '🐦', '💼'].map((icon, index) => (
                                    <div key={index} style={{
                                        width: '35px',
                                        height: '35px',
                                        backgroundColor: '#2d1b69',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        fontSize: '14px'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = currentColors.accent;
                                            e.target.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#2d1b69';
                                            e.target.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        {icon}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                marginBottom: '16px'
                            }}>
                                Quick Links
                            </h3>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                {['Home', 'Features', 'Showcase', 'Contact'].map((link) => (
                                    <a key={link} href={`#${link.toLowerCase()}`} style={{
                                        color: '#b8b8d0',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s ease',
                                        fontSize: '14px'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.target.style.color = currentColors.accentLight;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.color = '#b8b8d0';
                                        }}
                                    >
                                        {link}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                marginBottom: '16px'
                            }}>
                                Contact Info
                            </h3>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b8b8d0', fontSize: '14px' }}>
                                    <span>📧</span>
                                    <span>support@safejourney.com</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b8b8d0', fontSize: '14px' }}>
                                    <span>📞</span>
                                    <span>+1 (555) 123-4567</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b8b8d0', fontSize: '14px' }}>
                                    <span>🏢</span>
                                    <span>123 Safety Street</span>
                                </div>
                            </div>
                        </div>

                        {/* Newsletter */}
                        <div>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                marginBottom: '16px'
                            }}>
                                Newsletter
                            </h3>
                            <p style={{
                                color: '#b8b8d0',
                                marginBottom: '12px',
                                fontSize: '14px'
                            }}>
                                Subscribe to get safety tips
                            </p>
                            <div style={{
                                display: 'flex',
                                gap: '8px'
                            }}>
                                <input
                                    type="email"
                                    placeholder="Your email"
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: '#2d1b69',
                                        color: '#ffffff',
                                        fontSize: '12px'
                                    }}
                                />
                                <button style={{
                                    backgroundColor: currentColors.accent,
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '10px 16px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = currentColors.accentHover;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = currentColors.accent;
                                    }}
                                >
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div style={{
                        borderTop: '1px solid #2d1b69',
                        paddingTop: '20px',
                        textAlign: 'center',
                        color: '#b8b8d0',
                        fontSize: '12px'
                    }}>
                        <p>&copy; 2024 SafeJourney. All rights reserved. | Designed with ❤️ for your safety</p>
                    </div>
                </div>
            </footer>

            {/* Add CSS animations */}
            <style>
                {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Smooth scrolling for anchor links */
          html {
            scroll-behavior: smooth;
          }
          
          /* Improve mobile touch targets */
          @media (max-width: 768px) {
            button, a {
              min-height: 44px;
              min-width: 44px;
            }
            
            input, textarea {
              font-size: 16px; /* Prevents zoom on iOS */
            }
          }
        `}
            </style>
        </div>
    );
};

export default SafeJourney;